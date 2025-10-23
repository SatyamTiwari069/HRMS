import { db } from "./db";
import bcrypt from "bcryptjs";
import { users, employees, leaveBalances } from "@shared/schema";
import { eq } from "drizzle-orm";
import { encryptionService } from "./services/encryption-service";

async function seed() {
  console.log("Seeding database...");

  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Get or create users
    let adminUser = await db.query.users.findFirst({ where: eq(users.email, "admin@hrms.com") });
    if (!adminUser) {
      [adminUser] = await db.insert(users).values({
        email: "admin@hrms.com",
        password: hashedPassword,
        role: "admin",
      }).returning();
      console.log("Created admin user:", adminUser.email);
    } else {
      console.log("Admin user already exists");
    }

    let hrUser = await db.query.users.findFirst({ where: eq(users.email, "hr@hrms.com") });
    if (!hrUser) {
      [hrUser] = await db.insert(users).values({
        email: "hr@hrms.com",
        password: hashedPassword,
        role: "hr",
      }).returning();
      console.log("Created HR user:", hrUser.email);
    } else {
      console.log("HR user already exists");
    }

    let managerUser = await db.query.users.findFirst({ where: eq(users.email, "manager@hrms.com") });
    if (!managerUser) {
      [managerUser] = await db.insert(users).values({
        email: "manager@hrms.com",
        password: hashedPassword,
        role: "senior_manager",
      }).returning();
      console.log("Created manager user:", managerUser.email);
    } else {
      console.log("Manager user already exists");
    }

    let employeeUser = await db.query.users.findFirst({ where: eq(users.email, "employee@hrms.com") });
    if (!employeeUser) {
      [employeeUser] = await db.insert(users).values({
        email: "employee@hrms.com",
        password: hashedPassword,
        role: "employee",
      }).returning();
      console.log("Created employee user:", employeeUser.email);
    } else {
      console.log("Employee user already exists");
    }

    // Create employee profile if it doesn't exist
    const existingEmployee = await db.query.employees.findFirst({ 
      where: eq(employees.userId, employeeUser.id) 
    });

    if (!existingEmployee) {
      // Encrypt salary before storing
      const encryptedSalary = encryptionService.encrypt("75000");
      
      const [emp] = await db
        .insert(employees)
        .values({
          userId: employeeUser.id,
          firstName: "John",
          lastName: "Doe",
          department: "Engineering",
          position: "Software Developer",
          phone: "+1234567890",
          address: "123 Main St, City, State 12345",
          dateOfBirth: new Date("1990-01-01"),
          hireDate: new Date("2023-01-01"),
          baseSalary: encryptedSalary,
          status: "active",
        })
        .returning();

      console.log("Created employee profile:", emp.firstName, emp.lastName);

      // Create leave balances
      const currentYear = new Date().getFullYear();
      await db.insert(leaveBalances).values([
        {
          employeeId: emp.id,
          year: currentYear,
          leaveType: "casual",
          totalDays: "12",
          usedDays: "0",
          remainingDays: "12",
        },
        {
          employeeId: emp.id,
          year: currentYear,
          leaveType: "sick",
          totalDays: "10",
          usedDays: "0",
          remainingDays: "10",
        },
        {
          employeeId: emp.id,
          year: currentYear,
          leaveType: "vacation",
          totalDays: "20",
          usedDays: "0",
          remainingDays: "20",
        },
      ]);

      console.log("Created leave balances");
    } else {
      console.log("Employee profile already exists");
    }

    console.log("\n✅ Seed data created successfully!");
    console.log("\nTest Credentials:");
    console.log("Admin: admin@hrms.com / admin123");
    console.log("HR: hr@hrms.com / admin123");
    console.log("Manager: manager@hrms.com / admin123");
    console.log("Employee: employee@hrms.com / admin123");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    process.exit(0);
  }
}

seed();
