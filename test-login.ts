import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

async function testLogin() {
  try {
    console.log("Looking up user: superadmin@finberslink.com");
    
    const user = await prisma.user.findUnique({
      where: { email: "superadmin@finberslink.com" },
    });

    if (!user) {
      console.error("✗ User not found!");
      return;
    }

    console.log("✓ User found:");
    console.log("  ID:", user.id);
    console.log("  Email:", user.email);
    console.log("  Role:", user.role);
    console.log("  Password hash:", user.passwordHash);

    const passwordMatch = await verifyPassword("admin123", user.passwordHash);
    console.log("✓ Password verification result:", passwordMatch);

    if (!passwordMatch) {
      console.error("✗ Password does NOT match!");
    } else {
      console.log("✓ Login should work!");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
