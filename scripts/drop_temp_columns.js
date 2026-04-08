const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');
const fs = require('fs');

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '..', '.env.prisma_tmp');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error('No DATABASE_URL found.'); process.exit(1); }

(async () => {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const stmts = [
      'ALTER TABLE "Resume" DROP COLUMN IF EXISTS "headshotUrl";',
      'ALTER TABLE "Profile" DROP COLUMN IF EXISTS address;',
      'ALTER TABLE "Profile" DROP COLUMN IF EXISTS certifications;',
      'ALTER TABLE "Profile" DROP COLUMN IF EXISTS education;',
      'ALTER TABLE "Profile" DROP COLUMN IF EXISTS phone;'
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
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(2);
  }
})();
