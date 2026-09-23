import "dotenv/config";
import { verifyEmailConnection } from "../src/services/emailService.js";

try {
  await verifyEmailConnection();
  process.exit(0);
} catch (error) {
  console.error("SMTP connection failed:", error.message);
  process.exit(1);
}