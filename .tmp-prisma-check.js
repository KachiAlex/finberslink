const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findFirst();
    console.log("PRISMA_OK", Boolean(user));
  } catch (e) {
    console.error("PRISMA_ERR", e?.message || String(e));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
