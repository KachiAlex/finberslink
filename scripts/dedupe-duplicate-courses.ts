import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Aborting dedupe script.');
  process.exit(1);
}

const prisma = new PrismaClient();
async function main() {
  console.log('Scanning courses for duplicates (grouped by instructorId + normalized title)');

  const courses = await prisma.course.findMany({
    where: { archivedAt: null },
    select: { id: true, title: true, slug: true, instructorId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const groups = new Map<string, Array<{ id: string; title: string; slug: string; instructorId: string; createdAt: Date }>>();

  for (const c of courses) {
    const key = `${c.instructorId}|||${(c.title || '').trim().toLowerCase()}`;
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  let totalArchived = 0;

  for (const [key, arr] of groups) {
    if (arr.length <= 1) continue;

    // Keep the earliest created, archive the rest
    arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const keep = arr[0];
    const toArchive = arr.slice(1);

    for (const dup of toArchive) {
      const safeSlug = `${dup.slug}-duplicate-${dup.id}`.slice(0, 150);
      await prisma.course.update({
        where: { id: dup.id },
        data: { archivedAt: new Date(), slug: safeSlug },
      });
      console.log(`Archived duplicate course ${dup.id} (kept ${keep.id})`);
      totalArchived++;
    }
  }

  console.log(`Archived ${totalArchived} duplicate course(s)`);
}

main()
  .catch((err) => {
    console.error('Error deduping courses:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
