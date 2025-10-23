import { db } from "./db";
import { employees } from "@shared/schema";

async function cleanup() {
  console.log("Cleaning up employees...");
  try {
    await db.delete(employees);
    console.log("✅ All employees deleted");
  } catch (error) {
    console.error("Cleanup error:", error);
  } finally {
    process.exit(0);
  }
}

cleanup();
