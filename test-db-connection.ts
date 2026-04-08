import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

async function testDatabaseConnection() {
  try {
    console.log("Testing database connection to Render PostgreSQL...");
    console.log("URL:", process.env.DATABASE_URL?.replace(/:[^@]+@/, ":***@"));
    
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log("✓ Connected successfully!");
    console.log("Database version:", result);
  } catch (error) {
    console.error("✗ Connection failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
