import { PrismaClient, TenantPlanTier, TenantStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TENANT_SLUG = "finbers-link";
const DEFAULT_TENANT_NAME = "Finbers Link";

interface MigrationStats {
  totalUsers: number;
  usersWithoutTenant: number;
  usersAssigned: number;
  errors: Array<{ userId: string; error: string }>;
  tenantId: string;
  timestamp: Date;
}

async function getOrCreateDefaultTenant() {
  console.log(`Looking up default tenant with slug: ${DEFAULT_TENANT_SLUG}`);
  
  const tenant = await prisma.tenant.upsert({
    where: { slug: DEFAULT_TENANT_SLUG },
    update: { updatedAt: new Date() },
    create: {
      name: DEFAULT_TENANT_NAME,
      slug: DEFAULT_TENANT_SLUG,
      contactName: "Finbers Link Operations",
      contactEmail: "operations@finberslink.com",
      planTier: TenantPlanTier.PROFESSIONAL,
      status: TenantStatus.ACTIVE,
      seatLimit: 10000, // Large limit for default tenant
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

  console.log(`✓ Default tenant ready: ${tenant.id} (${tenant.name})`);
  return tenant;
}

async function migrateUsersToDefaultTenant(tenantId: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalUsers: 0,
    usersWithoutTenant: 0,
    usersAssigned: 0,
    errors: [],
    tenantId,
    timestamp: new Date(),
  };

  try {
    // Count total users
    stats.totalUsers = await prisma.user.count();
    console.log(`\nTotal users in database: ${stats.totalUsers}`);

    // Find users without a tenant
    const usersWithoutTenant = await prisma.user.findMany({
      where: { tenantId: null },
      select: { id: true, email: true, role: true },
    });

    stats.usersWithoutTenant = usersWithoutTenant.length;
    console.log(`Users without tenant assignment: ${stats.usersWithoutTenant}`);

    if (stats.usersWithoutTenant === 0) {
      console.log("✓ All users are already assigned to a tenant. No migration needed.");
      return stats;
    }

    // Assign users to the default tenant in batches
    const batchSize = 100;
    for (let i = 0; i < usersWithoutTenant.length; i += batchSize) {
      const batch = usersWithoutTenant.slice(i, i + batchSize);
      const userIds = batch.map((u) => u.id);

      try {
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { tenantId },
        });

        stats.usersAssigned += batch.length;
        const progress = Math.min(stats.usersAssigned, stats.usersWithoutTenant);
        console.log(`  [${progress}/${stats.usersWithoutTenant}] Users updated...`);
      } catch (error) {
        // Handle batch errors by updating individually
        for (const user of batch) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { tenantId },
            });
            stats.usersAssigned++;
          } catch (individualError) {
            stats.errors.push({
              userId: user.id,
              error: individualError instanceof Error ? individualError.message : String(individualError),
            });
            console.error(`  ✗ Failed to update user ${user.id} (${user.email}):`, individualError);
          }
        }
      }
    }

    console.log(`\n✓ Successfully assigned ${stats.usersAssigned} users to default tenant`);

    if (stats.errors.length > 0) {
      console.warn(`⚠ ${stats.errors.length} users failed to update:`);
      stats.errors.forEach((err) => {
        console.warn(`  - ${err.userId}: ${err.error}`);
      });
    }
  } catch (error) {
    console.error("Fatal error during migration:", error);
    throw error;
  }

  return stats;
}

async function verifyMigration(tenantId: string) {
  console.log("\nVerifying migration results...");

  const usersWithTenant = await prisma.user.count({
    where: { tenantId: { not: null } },
  });

  const usersWithoutTenant = await prisma.user.count({
    where: { tenantId: null },
  });

  const total = await prisma.user.count();

  console.log(`\nVerification Summary:`);
  console.log(`  Total users: ${total}`);
  console.log(`  Users with tenant: ${usersWithTenant}`);
  console.log(`  Users without tenant: ${usersWithoutTenant}`);

  if (usersWithoutTenant > 0) {
    console.warn(`⚠ Warning: ${usersWithoutTenant} users still don't have a tenant assigned!`);
    return false;
  }

  console.log(`✓ All users have been successfully assigned to a tenant`);
  return true;
}

async function main() {
  console.log("=".repeat(70));
  console.log("USER TO DEFAULT TENANT MIGRATION");
  console.log("=".repeat(70));

  try {
    // Ensure default tenant exists
    const tenant = await getOrCreateDefaultTenant();

    // Migrate users
    const stats = await migrateUsersToDefaultTenant(tenant.id);

    // Verify migration
    const success = await verifyMigration(tenant.id);

    // Print final report
    console.log("\n" + "=".repeat(70));
    console.log("MIGRATION REPORT");
    console.log("=".repeat(70));
    console.log(`Tenant ID: ${stats.tenantId}`);
    console.log(`Total users processed: ${stats.totalUsers}`);
    console.log(`Users without tenant (before): ${stats.usersWithoutTenant}`);
    console.log(`Users successfully assigned: ${stats.usersAssigned}`);
    console.log(`Migration errors: ${stats.errors.length}`);
    console.log(`Timestamp: ${stats.timestamp.toISOString()}`);
    console.log(`Status: ${success ? "✓ SUCCESS" : "✗ INCOMPLETE"}`);
    console.log("=".repeat(70));

    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
