import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createSuperadmin() {
  try {
    console.log("Creating superadmin account...");
    
    // Check if superadmin already exists
    const existing = await prisma.user.findUnique({
      where: { email: "superadmin@finberslink.com" },
    });

    if (existing) {
      console.log("Superadmin already exists:", existing.email);
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash("admin123", 10);

    // Create superadmin user
    const superadmin = await prisma.user.create({
      data: {
        email: "superadmin@finberslink.com",
        firstName: "Super",
        lastName: "Admin",
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    console.log("✓ Superadmin created successfully");
    console.log("  Email: superadmin@finberslink.com");
    console.log("  Password: admin123");
    console.log("  Role: SUPER_ADMIN");
    console.log("  ID:", superadmin.id);
  } catch (error) {
    console.error("Error creating superadmin:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperadmin();
