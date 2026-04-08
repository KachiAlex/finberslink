import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = await prisma.$queryRaw`select now() as now`;
  console.log('DB ok:', now);
}

main()
  .catch((err) => {
    console.error('DB error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
