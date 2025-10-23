import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { encryptionService } from "./services/encryption-service";
import {
  users,
  employees,
  attendance,
  leaveRequests,
  leaveBalances,
  payrollRecords,
  performanceReviews,
  jobPostings,
  applications,
  notifications,
  auditLogs,
  documents,
  faceEncodings,
  type User,
  type InsertUser,
  type Employee,
  type InsertEmployee,
  type Attendance,
  type InsertAttendance,
  type LeaveRequest,
  type InsertLeaveRequest,
  type LeaveBalance,
  type InsertLeaveBalance,
  type PayrollRecord,
  type InsertPayrollRecord,
  type PerformanceReview,
  type InsertPerformanceReview,
  type JobPosting,
  type InsertJobPosting,
  type Application,
  type InsertApplication,
  type Notification,
  type InsertNotification,
  type Document,
  type InsertDocument,
  type FaceEncoding,
  type InsertFaceEncoding,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;

  // Employees
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;

  // Attendance
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendanceByEmployeeAndDate(employeeId: string, date: Date): Promise<Attendance | undefined>;
  getAttendanceHistory(employeeId: string, limit?: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  getAttendanceStats(): Promise<any>;

  // Face Encodings
  getFaceEncoding(employeeId: string): Promise<FaceEncoding | undefined>;
  createFaceEncoding(encoding: InsertFaceEncoding): Promise<FaceEncoding>;

  // Leave Requests
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: string, request: Partial<LeaveRequest>): Promise<LeaveRequest | undefined>;

  // Leave Balances
  getLeaveBalances(employeeId: string, year: number): Promise<LeaveBalance[]>;
  createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance>;
  updateLeaveBalance(id: string, balance: Partial<LeaveBalance>): Promise<LeaveBalance | undefined>;

  // Payroll
  getPayrollRecord(id: string): Promise<PayrollRecord | undefined>;
  getPayrollRecordsByEmployee(employeeId: string): Promise<PayrollRecord[]>;
  getCurrentMonthPayroll(employeeId: string): Promise<PayrollRecord | undefined>;
  createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord>;

  // Performance Reviews
  getPerformanceReview(id: string): Promise<PerformanceReview | undefined>;
  getReviewsByEmployee(employeeId: string): Promise<PerformanceReview[]>;
  createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview>;
  updatePerformanceReview(id: string, review: Partial<PerformanceReview>): Promise<PerformanceReview | undefined>;

  // Job Postings
  getJobPosting(id: string): Promise<JobPosting | undefined>;
  getAllJobPostings(): Promise<JobPosting[]>;
  createJobPosting(job: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: string, job: Partial<JobPosting>): Promise<JobPosting | undefined>;

  // Applications
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsByJob(jobId: string): Promise<Application[]>;
  getAllApplications(): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, application: Partial<Application>): Promise<Application | undefined>;

  // Notifications
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;

  // Documents
  getDocumentsByEmployee(employeeId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  // Audit Logs
  createAuditLog(log: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
  }

  // Employees
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    if (employee) {
      try {
        // Decrypt salary when reading
        employee.baseSalary = encryptionService.decrypt(employee.baseSalary);
      } catch (error) {
        console.error('Failed to decrypt salary:', error);
      }
    }
    return employee || undefined;
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    if (employee) {
      try {
        // Decrypt salary when reading
        employee.baseSalary = encryptionService.decrypt(employee.baseSalary);
      } catch (error) {
        console.error('Failed to decrypt salary:', error);
      }
    }
    return employee || undefined;
  }

  async getAllEmployees(): Promise<Employee[]> {
    const allEmployees = await db.select().from(employees).orderBy(desc(employees.createdAt));
    // Decrypt salaries for all employees
    return allEmployees.map(emp => {
      try {
        emp.baseSalary = encryptionService.decrypt(emp.baseSalary);
      } catch (error) {
        console.error('Failed to decrypt salary for employee:', emp.id);
      }
      return emp;
    });
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(employee).returning();
    return created;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated || undefined;
  }

  // Attendance
  async getAttendance(id: string): Promise<Attendance | undefined> {
    const [record] = await db.select().from(attendance).where(eq(attendance.id, id));
    return record || undefined;
  }

  async getAttendanceByEmployeeAndDate(employeeId: string, date: Date): Promise<Attendance | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [record] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, employeeId),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      );
    return record || undefined;
  }

  async getAttendanceHistory(employeeId: string, limit = 30): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.employeeId, employeeId))
      .orderBy(desc(attendance.date))
      .limit(limit);
  }

  async createAttendance(record: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(attendance).values(record).returning();
    return created;
  }

  async updateAttendance(id: string, record: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updated] = await db
      .update(attendance)
      .set(record)
      .where(eq(attendance.id, id))
      .returning();
    return updated || undefined;
  }

  async getAttendanceStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats] = await db
      .select({
        presentToday: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'present' THEN 1 END)`,
        totalToday: sql<number>`COUNT(*)`,
      })
      .from(attendance)
      .where(gte(attendance.date, today));

    return stats;
  }

  // Face Encodings
  async getFaceEncoding(employeeId: string): Promise<FaceEncoding | undefined> {
    const [encoding] = await db
      .select()
      .from(faceEncodings)
      .where(eq(faceEncodings.employeeId, employeeId))
      .orderBy(desc(faceEncodings.createdAt))
      .limit(1);
    return encoding || undefined;
  }

  async createFaceEncoding(encoding: InsertFaceEncoding): Promise<FaceEncoding> {
    const [created] = await db.insert(faceEncodings).values(encoding).returning();
    return created;
  }

  // Leave Requests
  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request || undefined;
  }

  async getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, employeeId))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.status, 'pending'))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [created] = await db.insert(leaveRequests).values(request).returning();
    return created;
  }

  async updateLeaveRequest(id: string, request: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const [updated] = await db
      .update(leaveRequests)
      .set(request)
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated || undefined;
  }

  // Leave Balances
  async getLeaveBalances(employeeId: string, year: number): Promise<LeaveBalance[]> {
    return await db
      .select()
      .from(leaveBalances)
      .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));
  }

  async createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance> {
    const [created] = await db.insert(leaveBalances).values(balance).returning();
    return created;
  }

  async updateLeaveBalance(id: string, balance: Partial<LeaveBalance>): Promise<LeaveBalance | undefined> {
    const [updated] = await db
      .update(leaveBalances)
      .set({ ...balance, updatedAt: new Date() })
      .where(eq(leaveBalances.id, id))
      .returning();
    return updated || undefined;
  }

  // Payroll
  async getPayrollRecord(id: string): Promise<PayrollRecord | undefined> {
    const [record] = await db.select().from(payrollRecords).where(eq(payrollRecords.id, id));
    return record || undefined;
  }

  async getPayrollRecordsByEmployee(employeeId: string): Promise<PayrollRecord[]> {
    return await db
      .select()
      .from(payrollRecords)
      .where(eq(payrollRecords.employeeId, employeeId))
      .orderBy(desc(payrollRecords.year), desc(payrollRecords.month));
  }

  async getCurrentMonthPayroll(employeeId: string): Promise<PayrollRecord | undefined> {
    const now = new Date();
    const [record] = await db
      .select()
      .from(payrollRecords)
      .where(
        and(
          eq(payrollRecords.employeeId, employeeId),
          eq(payrollRecords.month, now.getMonth() + 1),
          eq(payrollRecords.year, now.getFullYear())
        )
      );
    return record || undefined;
  }

  async createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord> {
    const [created] = await db.insert(payrollRecords).values(record).returning();
    return created;
  }

  // Performance Reviews
  async getPerformanceReview(id: string): Promise<PerformanceReview | undefined> {
    const [review] = await db.select().from(performanceReviews).where(eq(performanceReviews.id, id));
    return review || undefined;
  }

  async getReviewsByEmployee(employeeId: string): Promise<PerformanceReview[]> {
    return await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.employeeId, employeeId))
      .orderBy(desc(performanceReviews.createdAt));
  }

  async createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview> {
    const [created] = await db.insert(performanceReviews).values(review).returning();
    return created;
  }

  async updatePerformanceReview(id: string, review: Partial<PerformanceReview>): Promise<PerformanceReview | undefined> {
    const [updated] = await db
      .update(performanceReviews)
      .set(review)
      .where(eq(performanceReviews.id, id))
      .returning();
    return updated || undefined;
  }

  // Job Postings
  async getJobPosting(id: string): Promise<JobPosting | undefined> {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, id));
    return job || undefined;
  }

  async getAllJobPostings(): Promise<JobPosting[]> {
    return await db
      .select()
      .from(jobPostings)
      .orderBy(desc(jobPostings.createdAt));
  }

  async createJobPosting(job: InsertJobPosting): Promise<JobPosting> {
    const [created] = await db.insert(jobPostings).values(job).returning();
    return created;
  }

  async updateJobPosting(id: string, job: Partial<JobPosting>): Promise<JobPosting | undefined> {
    const [updated] = await db
      .update(jobPostings)
      .set(job)
      .where(eq(jobPostings.id, id))
      .returning();
    return updated || undefined;
  }

  // Applications
  async getApplication(id: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app || undefined;
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.aiScore));
  }

  async getAllApplications(): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [created] = await db.insert(applications).values(application).returning();
    return created;
  }

  async updateApplication(id: string, application: Partial<Application>): Promise<Application | undefined> {
    const [updated] = await db
      .update(applications)
      .set(application)
      .where(eq(applications.id, id))
      .returning();
    return updated || undefined;
  }

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  // Documents
  async getDocumentsByEmployee(employeeId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.employeeId, employeeId))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  // Audit Logs
  async createAuditLog(log: any): Promise<void> {
    await db.insert(auditLogs).values(log);
  }
}

export const storage = new DatabaseStorage();
