const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.forumPost.count();
    const postEdits = await prisma.forumPostEdit.count();
    console.log('userCount:', userCount);
    console.log('forumPost count:', postCount);
    console.log('forumPostEdit count:', postEdits);

    const sampleUsers = await prisma.user.findMany({ take: 5, select: { id: true, email: true } });
    console.log('sample users:', sampleUsers);
  } catch (e) {
    console.error('Error querying DB:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
