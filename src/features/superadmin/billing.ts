import { prisma } from "@/lib/prisma";

export async function getSuperAdminBillingOverview() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { licenseExpiresAt: "asc" },
    select: {
      id: true,
      name: true,
      planTier: true,
      status: true,
      seatLimit: true,
      seatAllocated: true,
      licenseExpiresAt: true,
    },
    take: 20,
  });

  const totals = tenants.reduce(
    (acc, tenant) => {
      acc.seatLimit += tenant.seatLimit;
      acc.seatAllocated += tenant.seatAllocated;
      return acc;
    },
    {
      seatLimit: 0,
      seatAllocated: 0,
    }
  );

  return { tenants, totals };
}
