import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log("Resetting superadmin password...");
    
    const passwordHash = await bcrypt.hash("admin123", 10);
    console.log("New hash:", passwordHash);

    const user = await prisma.user.update({
      where: { email: "superadmin@finberslink.com" },
      data: { passwordHash },
    });

    console.log("✓ Password updated");
    console.log("  Email:", user.email);
    console.log("  New password hash:", user.passwordHash);
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
