const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');
const fs = require('fs');

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '..', '.env.prisma_tmp');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error('No DATABASE_URL'); process.exit(1); }

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  const stmts = [
    'ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "headshotUrl" text;',
    'ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS address text;',
    'ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS certifications jsonb;',
    'ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS education jsonb;',
    'ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS phone text;'
  ];
  for (const s of stmts) {
    try {
      await client.query(s);
      console.log('OK:', s);
    } catch (e) {
      console.error('ERR:', s, e.message);
    }
  }
  await client.end();
})();
