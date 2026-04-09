import { Pool } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('Fetching non-archived courses...');
    const res = await pool.query(
      `SELECT "id", "instructorId", "title", "slug", "createdAt" FROM "Course" WHERE "archivedAt" IS NULL ORDER BY "createdAt" ASC;`
    );

    type Row = { id: string; instructorId: string; title: string | null; slug: string; createdAt: Date };
    const rows = res.rows as unknown as Row[];

    const groups = new Map<string, Row[]>();

    for (const r of rows) {
      const key = `${r.instructorId}|||${(r.title || '').trim().toLowerCase()}`;
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    }

    let totalArchived = 0;

    for (const [key, arr] of groups) {
      if (arr.length <= 1) continue;

      // keep earliest (rows already ordered by createdAt asc)
      const keep = arr[0];
      const toArchive = arr.slice(1);

      console.log(`Found ${arr.length} duplicates for instructor ${keep.instructorId} title="${keep.title}". Keeping ${keep.id}, archiving ${toArchive.length}`);

      for (const dup of toArchive) {
        const newSlug = `${dup.slug}-duplicate-${dup.id}`.slice(0, 150);
        await pool.query('BEGIN');
        try {
          await pool.query(
            'UPDATE "Course" SET "archivedAt" = now(), slug = $1 WHERE id = $2',
            [newSlug, dup.id]
          );
          await pool.query('COMMIT');
          console.log(`Archived ${dup.id}`);
          totalArchived++;
        } catch (err) {
          await pool.query('ROLLBACK');
          console.error(`Failed to archive ${dup.id}:`, err);
        }
      }
    }

    console.log(`Archived ${totalArchived} duplicate course(s)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error running dedupe SQL script:', err);
  process.exitCode = 1;
});
