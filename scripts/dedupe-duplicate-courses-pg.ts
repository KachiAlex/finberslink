import { Client } from 'pg';

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    throw new Error('DATABASE_URL is required');
  }

  const client = new Client({ connectionString: conn });
  await client.connect();

  try {
    console.log('Finding duplicate courses grouped by instructorId + normalized title');

    const findSql = `
      SELECT "id", "instructorId", "title", "slug", "createdAt"
      FROM "Course"
      WHERE "archivedAt" IS NULL
      ORDER BY "createdAt" ASC
    `;

    const res = await client.query(findSql);
    const rows = res.rows;

    const groups: Record<string, Array<any>> = {};
    for (const r of rows) {
      const key = `${r.instructorid}|||${(r.title || '').trim().toLowerCase()}`;
      groups[key] = groups[key] || [];
      groups[key].push(r);
    }

    let totalArchived = 0;
    for (const key of Object.keys(groups)) {
      const arr = groups[key];
      if (arr.length <= 1) continue;

      // keep first (earliest), archive the rest
      const keep = arr[0];
      const toArchive = arr.slice(1);

      for (const dup of toArchive) {
        const newSlug = (dup.slug || 'course') + '-duplicate-' + dup.id.slice(0, 8);
        const updateSql = `UPDATE "Course" SET "archivedAt" = now(), slug = $1 WHERE id = $2`;
        await client.query(updateSql, [newSlug, dup.id]);
        console.log(`Archived duplicate course ${dup.id} (kept ${keep.id})`);
        totalArchived++;
      }
    }

    console.log(`Archived ${totalArchived} duplicate course(s)`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Error running dedupe-pg:', err);
  process.exitCode = 1;
});
