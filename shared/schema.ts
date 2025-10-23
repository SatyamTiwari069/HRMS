import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  decimal, 
  boolean,
  json,
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "senior_manager", "hr", "employee"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "on_leave", "half_day"]);
export const leaveTypeEnum = pgEnum("leave_type", ["sick", "casual", "vacation", "maternity", "paternity", "unpaid"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected", "cancelled"]);
export const applicationStatusEnum = pgEnum("application_status", ["applied", "screening", "interview", "offered", "rejected", "hired"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "closed", "draft"]);

// Users table (Authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("employee"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// Employees table (Profiles)
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  hireDate: timestamp("hire_date").notNull(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  baseSalary: text("base_salary").notNull(), // Encrypted salary stored as text
  avatar: text("avatar"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  status: text("status").notNull().default("active"), // active, inactive, terminated
  managerId: varchar("manager_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("employee_user_id_idx").on(table.userId),
  departmentIdx: index("employee_department_idx").on(table.department),
}));

// Facial encodings for biometric attendance
export const faceEncodings = pgTable("face_encodings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  encoding: text("encoding").notNull(), // Encrypted JSON string of face descriptor
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index("face_encoding_employee_id_idx").on(table.employeeId),
}));

// Attendance records
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  status: attendanceStatusEnum("status").notNull(),
  isLate: boolean("is_late").default(false),
  location: text("location"),
  isBiometric: boolean("is_biometric").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  employeeDateIdx: index("attendance_employee_date_idx").on(table.employeeId, table.date),
  dateIdx: index("attendance_date_idx").on(table.date),
}));

// Leave balances
export const leaveBalances = pgTable("leave_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  totalDays: decimal("total_days", { precision: 5, scale: 2 }).notNull(),
  usedDays: decimal("used_days", { precision: 5, scale: 2 }).default("0"),
  remainingDays: decimal("remaining_days", { precision: 5, scale: 2 }).notNull(),
  year: integer("year").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  employeeYearIdx: index("leave_balance_employee_year_idx").on(table.employeeId, table.year),
}));

// Leave requests
export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  days: decimal("days", { precision: 5, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: leaveStatusEnum("status").notNull().default("pending"),
  approverId: varchar("approver_id").references(() => employees.id),
  approverComments: text("approver_comments"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("leave_request_employee_idx").on(table.employeeId),
  statusIdx: index("leave_request_status_idx").on(table.status),
  dateRangeIdx: index("leave_request_date_range_idx").on(table.startDate, table.endDate),
}));

// Payroll records
export const payrollRecords = pgTable("payroll_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  bonuses: decimal("bonuses", { precision: 10, scale: 2 }).default("0"),
  overtime: decimal("overtime", { precision: 10, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  daysWorked: integer("days_worked").notNull(),
  daysAbsent: integer("days_absent").default(0),
  payslipUrl: text("payslip_url"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  employeeMonthYearIdx: index("payroll_employee_month_year_idx").on(table.employeeId, table.month, table.year),
}));

// Performance reviews
export const performanceReviews = pgTable("performance_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => employees.id),
  reviewPeriod: text("review_period").notNull(), // e.g., "Q1 2024", "2024"
  technicalScore: integer("technical_score"), // 1-5
  communicationScore: integer("communication_score"), // 1-5
  leadershipScore: integer("leadership_score"), // 1-5
  teamworkScore: integer("teamwork_score"), // 1-5
  overallScore: decimal("overall_score", { precision: 3, scale: 2 }), // Calculated average
  feedback: text("feedback"),
  aiGeneratedSummary: text("ai_generated_summary"),
  goals: json("goals").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index("performance_review_employee_idx").on(table.employeeId),
}));

// Job postings
export const jobPostings = pgTable("job_postings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(), // full-time, part-time, contract
  description: text("description").notNull(),
  requirements: json("requirements").$type<string[]>().notNull(),
  responsibilities: json("responsibilities").$type<string[]>().notNull(),
  salaryMin: decimal("salary_min", { precision: 10, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 10, scale: 2 }),
  status: jobStatusEnum("status").notNull().default("open"),
  postedBy: varchar("posted_by").notNull().references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
}, (table) => ({
  statusIdx: index("job_posting_status_idx").on(table.status),
  departmentIdx: index("job_posting_department_idx").on(table.department),
}));

// Applications
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobPostings.id, { onDelete: "cascade" }),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  candidatePhone: text("candidate_phone"),
  resumeUrl: text("resume_url").notNull(),
  coverLetter: text("cover_letter"),
  status: applicationStatusEnum("status").notNull().default("applied"),
  aiScore: decimal("ai_score", { precision: 5, scale: 2 }), // 0-100
  aiExtractedSkills: json("ai_extracted_skills").$type<string[]>(),
  aiExtractedExperience: json("ai_extracted_experience").$type<any>(),
  aiSummary: text("ai_summary"),
  interviewDate: timestamp("interview_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("application_job_id_idx").on(table.jobId),
  statusIdx: index("application_status_idx").on(table.status),
  emailIdx: index("application_email_idx").on(table.candidateEmail),
}));

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // leave_request, payroll, review, application, etc.
  isRead: boolean("is_read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notification_user_id_idx").on(table.userId),
  isReadIdx: index("notification_is_read_idx").on(table.isRead),
}));

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // create, update, delete, login, etc.
  resource: text("resource").notNull(), // employee, attendance, leave, etc.
  resourceId: varchar("resource_id"),
  oldData: json("old_data"),
  newData: json("new_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("audit_log_user_id_idx").on(table.userId),
  resourceIdx: index("audit_log_resource_idx").on(table.resource),
  createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
}));

// Documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // contract, certificate, id, etc.
  fileUrl: text("file_url").notNull(),
  uploadedBy: varchar("uploaded_by").notNull().references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  employeeIdIdx: index("document_employee_id_idx").on(table.employeeId),
}));

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8),
}).omit({ id: true, createdAt: true, lastLogin: true });

export const insertEmployeeSchema = createInsertSchema(employees, {
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  baseSalary: z.string().regex(/^\d+\.?\d{0,2}$/),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ 
  id: true, 
  createdAt: true 
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests, {
  reason: z.string().min(10),
  days: z.string().regex(/^\d+\.?\d{0,2}$/),
}).omit({ id: true, createdAt: true, status: true, approverId: true, approverComments: true, approvedAt: true });

export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({ 
  id: true, 
  createdAt: true 
});

export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews, {
  technicalScore: z.number().min(1).max(5).optional(),
  communicationScore: z.number().min(1).max(5).optional(),
  leadershipScore: z.number().min(1).max(5).optional(),
  teamworkScore: z.number().min(1).max(5).optional(),
}).omit({ id: true, createdAt: true, aiGeneratedSummary: true });

export const insertJobPostingSchema = createInsertSchema(jobPostings, {
  title: z.string().min(1),
  description: z.string().min(50),
}).omit({ id: true, createdAt: true, closedAt: true });

export const insertApplicationSchema = createInsertSchema(applications, {
  candidateName: z.string().min(1),
  candidateEmail: z.string().email(),
}).omit({ 
  id: true, 
  createdAt: true, 
  status: true, 
  aiScore: true, 
  aiExtractedSkills: true, 
  aiExtractedExperience: true, 
  aiSummary: true 
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true 
});

export const insertFaceEncodingSchema = createInsertSchema(faceEncodings).omit({ 
  id: true, 
  createdAt: true 
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;

export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;
export type LeaveBalance = typeof leaveBalances.$inferSelect;

export type InsertPayrollRecord = z.infer<typeof insertPayrollRecordSchema>;
export type PayrollRecord = typeof payrollRecords.$inferSelect;

export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type PerformanceReview = typeof performanceReviews.$inferSelect;

export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertFaceEncoding = z.infer<typeof insertFaceEncodingSchema>;
export type FaceEncoding = typeof faceEncodings.$inferSelect;

export type AuditLog = typeof auditLogs.$inferSelect;

// Extended types with relations
export type EmployeeWithUser = Employee & { user: User };
export type LeaveRequestWithEmployee = LeaveRequest & { employee: Employee };
export type ApplicationWithJob = Application & { job: JobPosting };
export type AttendanceWithEmployee = Attendance & { employee: Employee };
export type PayrollWithEmployee = PayrollRecord & { employee: Employee };
export type ReviewWithEmployees = PerformanceReview & { 
  employee: Employee; 
  reviewer: Employee;
};
