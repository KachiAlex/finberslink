#!/usr/bin/env node

const { execSync } = require('child_process');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('✗ DATABASE_URL is not set.');
  process.exit(1);
}

try {
  console.log('Deploying migrations to Neon database...');
  const output = execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✓ Migrations deployed successfully');
} catch (error) {
  console.error('✗ Migration deployment failed:', error.message);
  process.exit(1);
}
