import { prisma } from "@/lib/prisma";

type VolunteerFilters = {
  search?: string;
  location?: string;
  country?: string;
  remoteOnly?: boolean;
  limit?: number;
};

export async function listVolunteerOpportunities(filters: VolunteerFilters = {}) {
  const { search, location, country, remoteOnly, limit = 12 } = filters;

  const where: any = {};

  if (remoteOnly) {
    where.isRemote = true;
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (country) {
    where.country = { equals: country, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { organization: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { skills: { has: search } },
    ];
  }

  return prisma.volunteerOpportunity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });
}

export async function getVolunteerOpportunityById(id: string) {
  return prisma.volunteerOpportunity.findUnique({
    where: { id },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });
}
