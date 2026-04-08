import { prisma } from "@/lib/prisma";
import { getDashboardInsights, invalidateDashboardInsights } from "@/features/dashboard/service";

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for --${key}`);
      }
      result[key] = value;
      i++;
    }
  }
  return result;
}

async function selectUser(email?: string) {
  if (email) {
    const user = await prisma.user.findUnique({ select: { id: true, email: true }, where: { email } });
    if (!user) {
      throw new Error(`User with email ${email} not found.`);
    }
    return user;
  }

  const fallback = await prisma.user.findFirst({
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });
  if (!fallback) {
    throw new Error("No users found. Seed the database before running this check.");
  }
  return fallback;
}

async function main() {
  const { email } = parseArgs();
  const user = await selectUser(email);

  console.log(`Using user ${user.email} (${user.id}) to verify dashboard insight caching`);

  console.time("first-fetch");
  const first = await getDashboardInsights(user.id);
  console.timeEnd("first-fetch");
  console.log("First fetch focus cards:", first.focus.length, "skill insight?", Boolean(first.skills));

  console.time("second-fetch");
  const second = await getDashboardInsights(user.id);
  console.timeEnd("second-fetch");
  const cacheHit = JSON.stringify(first) === JSON.stringify(second);
  console.log("Second fetch identical to first?", cacheHit);

  console.log("Invalidating cache...");
  await invalidateDashboardInsights(user.id);

  console.time("post-invalidate");
  const third = await getDashboardInsights(user.id);
  console.timeEnd("post-invalidate");
  const refreshed = JSON.stringify(second) !== JSON.stringify(third);
  console.log("Post-invalidation payload differs from cached version?", refreshed);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Dashboard insight check failed:", error);
  prisma.$disconnect();
  process.exit(1);
});
