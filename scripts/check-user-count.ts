import { prisma } from "@/lib/prisma";

async function main() {
  const count = await prisma.user.count();
  console.log(`Total users: ${count}`);

  if (count > 0) {
    const recent = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, createdAt: true },
    });
    console.table(recent);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Failed to count users", error);
  prisma.$disconnect();
  process.exit(1);
});
