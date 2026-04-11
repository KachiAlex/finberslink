import { prisma } from "@/lib/prisma";

export async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    include: { jobs: true },
  });
}

export async function listCompanies(skip: number = 0, take: number = 10) {
  return prisma.company.findMany({
    skip,
    take,
    include: { jobs: true },
  });
}

export async function getCompanyJobs(companyId: string) {
  return prisma.jobOpportunity.findMany({
    where: { companyId },
  });
}


export async function getCompanyStats(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { jobs: true },
  });
  
  if (!company) return null;
  
  return {
    totalJobs: company.jobs.length,
    totalApplications: 0,
    avgRating: 0,
  };
}
