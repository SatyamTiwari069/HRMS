import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import multer from "multer";
import { pool } from "./db";
import { storage } from "./storage";
import { aiService } from "./services/ai-service";
import { encryptionService } from "./services/encryption-service";
import {
  insertUserSchema,
  insertEmployeeSchema,
  insertAttendanceSchema,
  insertLeaveRequestSchema,
  insertLeaveBalanceSchema,
  insertPayrollRecordSchema,
  insertPerformanceReviewSchema,
  insertJobPostingSchema,
  insertApplicationSchema,
  insertNotificationSchema,
  insertDocumentSchema,
  insertFaceEncodingSchema,
} from "@shared/schema";
import { z } from "zod";

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP",
});

// Session configuration with PostgreSQL store
const PgSession = connectPgSimple(session);
const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "hrms-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Role-based authorization
function requireRole(...roles: string[]) {
  return async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user = user;
    next();
  };
}

// Audit logging middleware
function auditLog(action: string, resource: string) {
  return async (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      if (res.statusCode < 400 && req.session?.userId) {
        storage.createAuditLog({
          userId: req.session.userId,
          action,
          resource,
          resourceId: data?.id || null,
          newData: data,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }).catch(console.error);
      }
      return originalJson(data);
    };
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionMiddleware);
  app.use('/api', apiLimiter);

  // ===== AUTHENTICATION ROUTES =====
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validated.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validated,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;
      
      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.updateUserLastLogin(user.id);
      req.session.userId = user.id;

      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // ===== EMPLOYEE ROUTES =====
  app.get('/api/employees', requireAuth, requireRole('admin', 'hr', 'senior_manager'), async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees', requireAuth, requireRole('admin', 'hr'), auditLog('create', 'employee'), async (req, res) => {
    try {
      const validated = insertEmployeeSchema.parse(req.body);
      
      // Encrypt salary
      const encryptedSalary = encryptionService.encrypt(validated.baseSalary);
      
      const employee = await storage.createEmployee({
        ...validated,
        baseSalary: encryptedSalary,
      });
      
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create employee' });
    }
  });

  app.get('/api/profile', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // ===== ATTENDANCE ROUTES =====
  app.get('/api/attendance/today', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const today = new Date();
      const attendance = await storage.getAttendanceByEmployeeAndDate(employee.id, today);
      res.json(attendance || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's attendance" });
    }
  });

  app.get('/api/attendance/history', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const history = await storage.getAttendanceHistory(employee.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance history" });
    }
  });

  app.post('/api/attendance/clock-in', requireAuth, auditLog('create', 'attendance'), async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const today = new Date();
      const existing = await storage.getAttendanceByEmployeeAndDate(employee.id, today);
      
      if (existing && existing.clockIn) {
        return res.status(400).json({ message: "Already clocked in today" });
      }

      const now = new Date();
      const workStartTime = new Date(now);
      workStartTime.setHours(9, 0, 0, 0); // 9 AM
      const isLate = now > workStartTime;

      const attendance = await storage.createAttendance({
        employeeId: employee.id,
        date: today,
        clockIn: now,
        status: isLate ? 'late' : 'present',
        isLate,
        location: req.body.location,
        isBiometric: req.body.isBiometric || false,
      });

      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to clock in' });
    }
  });

  app.post('/api/attendance/clock-out', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const today = new Date();
      const attendance = await storage.getAttendanceByEmployeeAndDate(employee.id, today);
      
      if (!attendance) {
        return res.status(400).json({ message: "No clock-in record found" });
      }

      if (attendance.clockOut) {
        return res.status(400).json({ message: "Already clocked out" });
      }

      const updated = await storage.updateAttendance(attendance.id, {
        clockOut: new Date(),
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  // ===== LEAVE ROUTES =====
  app.get('/api/leaves/requests', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const requests = await storage.getLeaveRequestsByEmployee(employee.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  app.get('/api/leaves/balances', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const year = new Date().getFullYear();
      const balances = await storage.getLeaveBalances(employee.id, year);
      res.json(balances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave balances" });
    }
  });

  app.post('/api/leaves/request', requireAuth, auditLog('create', 'leave'), async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const validated = insertLeaveRequestSchema.parse(req.body);
      
      // Calculate days
      const start = new Date(validated.startDate);
      const end = new Date(validated.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const request = await storage.createLeaveRequest({
        ...validated,
        employeeId: employee.id,
        days: days.toString(),
      });

      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create leave request' });
    }
  });

  // ===== PAYROLL ROUTES =====
  app.get('/api/payroll/records', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const records = await storage.getPayrollRecordsByEmployee(employee.id);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.get('/api/payroll/current', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const record = await storage.getCurrentMonthPayroll(employee.id);
      res.json(record || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current payroll" });
    }
  });

  // ===== PERFORMANCE ROUTES =====
  app.get('/api/performance/my-reviews', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const reviews = await storage.getReviewsByEmployee(employee.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/performance/reviews/:id/ai-summary', requireAuth, async (req, res) => {
    try {
      const review = await storage.getPerformanceReview(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      const summary = await aiService.generatePerformanceSummary(review);
      
      const updated = await storage.updatePerformanceReview(review.id, {
        aiGeneratedSummary: summary,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI summary" });
    }
  });

  // ===== RECRUITMENT ROUTES =====
  app.get('/api/recruitment/jobs', requireAuth, async (req, res) => {
    try {
      const jobs = await storage.getAllJobPostings();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job postings" });
    }
  });

  app.get('/api/recruitment/applications', requireAuth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post('/api/recruitment/apply', upload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Resume file required" });
      }

      // Parse resume with AI
      const resumeText = req.file.buffer.toString('utf-8').substring(0, 5000);
      const parsed = await aiService.parseResume(resumeText);
      
      // Score candidate (simplified - would use actual job requirements)
      const score = await aiService.scoreCandidate(parsed, ['JavaScript', 'React', 'Node.js']);

      const application = await storage.createApplication({
        jobId: req.body.jobId,
        candidateName: req.body.candidateName,
        candidateEmail: req.body.candidateEmail,
        candidatePhone: req.body.candidatePhone,
        resumeUrl: `/uploads/${req.file.originalname}`,
        aiScore: score.toString(),
        aiExtractedSkills: parsed.skills,
        aiExtractedExperience: parsed.experience,
        aiSummary: parsed.summary,
      });

      res.json(application);
    } catch (error) {
      console.error('Application error:', error);
      res.status(500).json({ message: "Failed to process application" });
    }
  });

  // ===== DOCUMENT ROUTES =====
  app.get('/api/documents', requireAuth, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const documents = await storage.getDocumentsByEmployee(employee.id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents/upload', requireAuth, upload.single('document'), auditLog('create', 'document'), async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId);
      if (!employee || !req.file) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const document = await storage.createDocument({
        employeeId: employee.id,
        title: req.body.title,
        type: req.body.type,
        fileUrl: `/uploads/${req.file.originalname}`,
        uploadedBy: employee.id,
      });

      res.json(document);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to upload document' });
    }
  });

  app.post('/api/documents/:id/analyze', requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocumentsByEmployee(req.params.id);
      // Simplified - would actually analyze the document
      const analysis = await aiService.analyzeDocument("Sample document text");
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

  // ===== CHATBOT ROUTES =====
  app.post('/api/chatbot/message', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const response = await aiService.chatbotResponse(req.body.message, {
        role: user.role,
        email: user.email,
      });

      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // ===== DASHBOARD ROUTES =====
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      const attendanceStats = await storage.getAttendanceStats();
      const pendingLeaves = await storage.getPendingLeaveRequests();

      const stats = {
        totalEmployees: user?.role === 'employee' ? undefined : (await storage.getAllEmployees()).length,
        presentToday: attendanceStats?.presentToday || 0,
        pendingLeaves: user?.role === 'employee' ? undefined : pendingLeaves.length,
        avgPerformance: 4.2,
        attendanceRate: attendanceStats?.totalToday > 0 
          ? Math.round((attendanceStats.presentToday / attendanceStats.totalToday) * 100)
          : 0,
        pendingRecruitments: 5,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activity', requireAuth, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.session.userId);
      res.json(notifications.slice(0, 5));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
