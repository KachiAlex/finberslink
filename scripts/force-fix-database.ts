#!/usr/bin/env node
/**
 * AGGRESSIVE DATABASE FIX SCRIPT
 * 
 * This script directly manipulates the _prisma_migrations table to resolve
 * stuck migrations and allows Prisma to proceed with schema synchronization.
 * 
 * DANGER: This should only be used when normal migration resolution fails.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function forceFixDatabase() {
  console.log("🔧 Starting aggressive database fix...\n");

  try {
    // List all migrations
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT id, migration, finished_at, rolled_back_at FROM _prisma_migrations
      ORDER BY started_at DESC
    `;

    console.log("Current migration state:");
    migrations.forEach((m) => {
      const status = m.rolled_back_at
        ? "ROLLED BACK"
        : m.finished_at
        ? "APPLIED"
        : "PENDING";
      console.log(`  ${m.migration} - ${status}`);
    });

    console.log("\n🎯 Targeting problematic migrations...\n");

    // Force mark specific failed migrations as rolled back
    const problematicMigrations = [
      "20260226035416_sync_email_unique",
      "20260323083000_add_enrollment_assignment_id",
      "20260324_add_tutor_approval",
    ];

    for (const migrationName of problematicMigrations) {
      const exists = migrations.find((m) => m.migration === migrationName);
      if (exists && !exists.rolled_back_at) {
        console.log(`  ✓ Rolling back ${migrationName}...`);
        await prisma.$executeRaw`
          UPDATE _prisma_migrations 
          SET rolled_back_at = NOW()
          WHERE migration = ${migrationName}
        `;
      } else if (!exists) {
        console.log(`  ⊘ ${migrationName} not found in database`);
      } else {
        console.log(`  ⊙ ${migrationName} already rolled back`);
      }
    }

    console.log("\n✅ Database fix complete!");
    console.log(
      "Next step: Run `npm run migrate:force` to apply remaining migrations\n"
    );
  } catch (error) {
    console.error("❌ Error during database fix:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

forceFixDatabase();
