import { prisma } from "@/lib/prisma";

export async function getCompanies(filters?: { search?: string; page?: number; limit?: number }) {
  const { search, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { industry: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logo: true,
        industry: true,
        location: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logo: true,
      website: true,
      industry: true,
      location: true,
      size: true,
      createdAt: true,
      _count: {
        select: {
          jobs: true,
        },
      },
    },
  });
}

export async function getCompanyJobs(companyId: string) {
  return prisma.jobOpportunity.findMany({
    where: {
      company: { equals: "", mode: "insensitive" }, // Will be updated when company FK is added
      isActive: true,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      company: true,
      country: true,
      location: true,
      jobType: true,
      remoteOption: true,
      salaryRange: true,
      tags: true,
      createdAt: true,
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createCompany(data: {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  industry?: string;
  location?: string;
  size?: string;
}) {
  const slug = data.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return prisma.company.create({
    data: {
      slug,
      ...data,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logo: true,
      website: true,
      industry: true,
      location: true,
      size: true,
      createdAt: true,
    },
  });
}

export async function updateCompany(
  companyId: string,
  data: {
    name?: string;
    description?: string;
    website?: string;
    logo?: string;
    industry?: string;
    location?: string;
    size?: string;
  }
) {
  return prisma.company.update({
    where: { id: companyId },
    data,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logo: true,
      website: true,
      industry: true,
      location: true,
      size: true,
      createdAt: true,
    },
  });
}

export async function deleteCompany(companyId: string) {
  return prisma.company.delete({
    where: { id: companyId },
  });
}

export async function getCompanyStats(companyId: string) {
  const [jobCount, applicationCount, totalViews] = await Promise.all([
    prisma.jobOpportunity.count({
      where: {
        company: { equals: "", mode: "insensitive" }, // Will be updated when company FK is added
      },
    }),
    prisma.jobApplication.count({
      where: {
        opportunity: {
          company: { equals: "", mode: "insensitive" }, // Will be updated when company FK is added
        },
      },
    }),
    prisma.jobOpportunity.aggregate({
      where: {
        company: { equals: "", mode: "insensitive" }, // Will be updated when company FK is added
      },
      _sum: {
        viewCount: true,
      },
    }),
  ]);

  return {
    jobCount,
    applicationCount,
    totalViews: totalViews._sum.viewCount || 0,
  };
}
