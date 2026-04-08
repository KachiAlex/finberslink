import { prisma } from "@/lib/prisma";

export async function getSuperAdminOverview() {
  try {
    const [totalTenants, activeTenants, suspendedTenants, totalUsers, recentTenants, renewals, usageSnapshots] =
      await Promise.all([
        prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count(),
      prisma.tenant.findMany({
        take: 4,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          planTier: true,
          status: true,
          seatLimit: true,
          seatAllocated: true,
          licenseExpiresAt: true,
          _count: { select: { users: true } },
        },
      }),
      prisma.tenant.findMany({
        where: { licenseExpiresAt: { not: null } },
        orderBy: { licenseExpiresAt: "asc" },
        take: 5,
        select: {
          id: true,
          name: true,
          planTier: true,
          licenseExpiresAt: true,
          status: true,
        },
      }),
      prisma.tenantUsage.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          tenantId: true,
          year: true,
          month: true,
          activeStudents: true,
          activeTutors: true,
          activeJobs: true,
          applications: true,
          storageUsedMb: true,
          tenant: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

  return {
    stats: {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers,
    },
    recentTenants,
    renewals,
    usageSnapshots,
  };
  } catch (error) {
    console.error("Failed to load superadmin dashboard:", error);
    // Return empty data structure on database error to prevent page crash
    return {
      stats: {
        totalTenants: 0,
        activeTenants: 0,
        suspendedTenants: 0,
        totalUsers: 0,
      },
      recentTenants: [],
      renewals: [],
      usageSnapshots: [],
    };
  }
}
