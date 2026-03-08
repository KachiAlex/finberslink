import { prisma } from "@/lib/prisma";

export async function getSuperAdminUsageOverview() {
  const snapshots = await prisma.tenantUsage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: {
          name: true,
          planTier: true,
        },
      },
    },
    take: 12,
  });

  const totals = snapshots.reduce(
    (
      acc,
      snapshot
    ) => {
      acc.activeStudents += snapshot.activeStudents;
      acc.activeTutors += snapshot.activeTutors;
      acc.activeJobs += snapshot.activeJobs;
      acc.applications += snapshot.applications;
      acc.storageUsedMb += snapshot.storageUsedMb;
      return acc;
    },
    {
      activeStudents: 0,
      activeTutors: 0,
      activeJobs: 0,
      applications: 0,
      storageUsedMb: 0,
    }
  );

  return { snapshots, totals };
}
