import type { JobApplicationStatus, JobOpportunity, JobType, RemoteOption } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type JobListing = JobOpportunity & {
  _count?: {
    applications: number;
  };
};

export interface JobFilters {
  search?: string;
  location?: string;
  jobType?: JobType;
  remoteOption?: RemoteOption;
  company?: string;
  tags?: string[];
  featured?: boolean;
  page?: number;
  limit?: number;
}

type JobWhereInput = NonNullable<Parameters<typeof prisma.jobOpportunity.findMany>[0]>["where"];

export async function getJobs(filters: JobFilters = {}) {
  const {
    search,
    location,
    jobType,
    remoteOption,
    company,
    tags,
    featured,
    page = 1,
    limit = 20,
  } = filters;

  const where: JobWhereInput = { isActive: true };

  if (jobType) {
    where.jobType = jobType;
  }

  if (remoteOption) {
    where.remoteOption = remoteOption;
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { hasSome: [search] } },
    ];
  }

  if (location) {
    where.OR = [
      ...(where.OR ?? []),
      { location: { contains: location, mode: "insensitive" } },
      { country: { contains: location, mode: "insensitive" } },
    ];
  }

  if (company) {
    where.company = { contains: company, mode: "insensitive" };
  }

  if (tags && tags.length > 0) {
    where.tags = { hasEvery: tags };
  }

  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    prisma.jobOpportunity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    }) as Promise<JobListing[]>,
    prisma.jobOpportunity.count({ where }),
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getJobBySlug(slug: string) {
  return prisma.jobOpportunity.findUnique({
    where: { slug: slug || '' },
  });
}

export async function getJobById(jobId: string) {
  return prisma.jobOpportunity.findUnique({
    where: { id: jobId },
  });
}

export async function incrementJobViewCount(jobId: string) {
  return prisma.jobOpportunity.update({
    where: { id: jobId },
    data: { viewCount: { increment: 1 } },
  });
}

export async function getFeaturedJobs(limit = 5) {
  return prisma.jobOpportunity.findMany({
    where: { isActive: true, featured: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });
}

export async function getRecentJobs(limit = 10) {
  return prisma.jobOpportunity.findMany({
    where: { isActive: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPopularCompanies(limit = 10) {
  const jobs = await prisma.jobOpportunity.findMany({
    where: { isActive: true },
    select: { company: true },
  });
  
  const companyCounts: Record<string, number> = {};
  jobs.forEach(job => {
    companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
  });

  return Object.entries(companyCounts)
    .map(([name, jobCount]) => ({ name, jobCount }))
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, limit);
}

export async function getJobTags() {
  const jobs = await prisma.jobOpportunity.findMany({
    where: { isActive: true },
    select: { tags: true },
  });
  
  const allTags = jobs.flatMap(job => job.tags).filter(tag => tag && tag.length > 0);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function createJobApplication(data: {
  jobOpportunityId: string;
  userId: string;
  resumeId?: string;
  coverLetter?: string;
}) {
  return prisma.jobApplication.create({
    data: {
      userId: data.userId,
      jobOpportunityId: data.jobOpportunityId,
      resumeId: data.resumeId,
      coverLetter: data.coverLetter,
      status: 'SUBMITTED',
    },
  });
}

export async function getUserJobApplications(userId: string) {
  return prisma.jobApplication.findMany({
    where: { userId },
    include: { opportunity: true, resume: true },
    orderBy: { submittedAt: 'desc' },
  });
}

export async function updateJobApplicationStatus(
  applicationId: string,
  status: JobApplicationStatus
) {
  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });
}

export async function saveJob(userId: string, jobOpportunityId: string) {
  return prisma.jobSave.upsert({
    where: { userId_jobOpportunityId: { userId, jobOpportunityId } },
    update: {},
    create: { userId, jobOpportunityId },
  });
}

export async function unsaveJob(userId: string, jobOpportunityId: string) {
  return prisma.jobSave.delete({
    where: { userId_jobOpportunityId: { userId, jobOpportunityId } },
  });
}

export async function listSavedJobs(userId: string) {
  return prisma.jobSave.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      jobOpportunity: {
        include: {
          _count: { select: { applications: true } },
        },
      },
    },
  });
}

export async function isJobSaved(userId: string, jobOpportunityId: string) {
  const existing = await prisma.jobSave.findUnique({
    where: { userId_jobOpportunityId: { userId, jobOpportunityId } },
  });
  return Boolean(existing);
}

export async function getJobApplicationsForAdmin(jobId?: string) {
  const where = jobId ? { jobOpportunityId: jobId } : {};
  return prisma.jobApplication.findMany({
    where,
    include: { user: true, opportunity: true, resume: true },
    orderBy: { submittedAt: 'desc' },
  });
}
