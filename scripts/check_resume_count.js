const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');
const fs = require('fs');

const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '..', '.env.prisma_tmp');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No DATABASE_URL found.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const r = await client.query('SELECT count(*)::int AS c FROM "Resume";');
    console.log('resume_count:', r.rows[0].c);
    await client.end();
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(2);
  }
})();
