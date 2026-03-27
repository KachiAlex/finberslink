#!/usr/bin/env node

const { execSync } = require('child_process');

const neonDatabaseUrl = 'postgresql://neondb_owner:npg_udNGF8hZj9vO@ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

try {
  console.log('Deploying migrations to Neon database...');
  const output = execSync('npx prisma migrate deploy --skip-generate', {
    env: { ...process.env, DATABASE_URL: neonDatabaseUrl },
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✓ Migrations deployed successfully');
} catch (error) {
  console.error('✗ Migration deployment failed:', error.message);
  process.exit(1);
}
