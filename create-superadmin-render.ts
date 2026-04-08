import { PrismaClient, TenantPlanTier, TenantStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_TENANT_SLUG = "finbers-link";
const SUPERADMIN_EMAIL = "superadmin@finberslink.com";

async function getOrCreateDefaultTenant() {
  return prisma.tenant.upsert({
    where: { slug: DEFAULT_TENANT_SLUG },
    update: { updatedAt: new Date() },
    create: {
      name: "Finbers Link",
      slug: DEFAULT_TENANT_SLUG,
      contactName: "Finbers Link Operations",
      contactEmail: "operations@finberslink.com",
      planTier: TenantPlanTier.PROFESSIONAL,
      status: TenantStatus.ACTIVE,
      seatLimit: 10000,
    },
  });
}

async function createSuperadmin() {
  try {
    console.log("Creating superadmin account...");
    
    // Ensure default tenant exists
    const defaultTenant = await getOrCreateDefaultTenant();
    console.log(`✓ Default tenant ready: ${defaultTenant.id}`);
    
    // Check if superadmin already exists
    const existing = await prisma.user.findUnique({
      where: { email: SUPERADMIN_EMAIL },
    });

    if (existing) {
      console.log("Superadmin already exists:", existing.email);
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash("admin123", 10);

    // Create superadmin user with tenantId
    const superadmin = await prisma.user.create({
      data: {
        email: SUPERADMIN_EMAIL,
        firstName: "Super",
        lastName: "Admin",
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        tenantId: defaultTenant.id,
      },
    });

    console.log("✓ Superadmin created successfully");
    console.log("  Email:", SUPERADMIN_EMAIL);
    console.log("  Password: admin123");
    console.log("  Role: SUPER_ADMIN");
    console.log("  Tenant: Finbers Link");
    console.log("  ID:", superadmin.id);
    console.log("  TenantID:", superadmin.tenantId);
  } catch (error) {
    console.error("Error creating superadmin:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperadmin();
