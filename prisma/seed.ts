import { PrismaClient, TenantPlanTier, TenantStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = "superadmin@finberslink.com";
const SUPERADMIN_PASSWORD = "$2b$12$2d4jc6iyBNMkBfaU8QfsTexvpL9ejX/2szE3odRYbPg4xn4NOOUSm"; // bcrypt hash for admin123

async function seedTenant() {
  return prisma.tenant.upsert({
    where: { slug: "finbers-link" },
    update: {
      contactName: "Finbers Operations",
      contactEmail: "ops@finberslink.com",
      updatedAt: new Date(),
    },
    create: {
      id: "tenant_finbers",
      name: "Finbers Link",
      slug: "finbers-link",
      contactName: "Finbers Operations",
      contactEmail: "ops@finberslink.com",
      planTier: TenantPlanTier.PROFESSIONAL,
      status: TenantStatus.ACTIVE,
      settings: {
        create: {
          featureFlags: {
            aiCourseQa: true,
            jobAutoSync: true,
            guardianMode: false,
          },
        },
      },
    },
    include: { settings: true },
  });
}

async function seedSuperAdmin(tenantId: string) {
  return prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: {
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      tenantId,
    },
    create: {
      id: "user_superadmin",
      email: SUPERADMIN_EMAIL,
      passwordHash: SUPERADMIN_PASSWORD,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      tenantId,
      profile: {
        create: {
          headline: "Platform Super Admin",
          location: "Remote",
          skills: ["Platform Ops"],
        },
      },
    },
  });
}

async function main() {
  const tenant = await seedTenant();
  await seedSuperAdmin(tenant.id);
  console.log("Seeded tenant and super admin account only.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
