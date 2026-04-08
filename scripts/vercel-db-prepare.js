#!/usr/bin/env node

const { execSync } = require('child_process');
const { ensureDbSchema } = require('./ensure-db-schema');

function runPrismaMigrateDeploy() {
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('Prisma migrate deploy completed.');
  } catch (error) {
    // Migration history may be out of sync on legacy environments.
    // Continue to schema ensure step to guarantee required runtime objects exist.
    console.warn('Prisma migrate deploy failed; continuing with schema ensure fallback.');
  }
}

(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required during build.');
  }

  runPrismaMigrateDeploy();
  await ensureDbSchema();
})().catch((error) => {
  console.error('DB prepare failed:', error.message);
  process.exit(1);
});
