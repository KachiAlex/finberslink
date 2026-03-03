import { prisma } from "@/lib/prisma";

export interface JobFilters {
  search?: string;
  location?: string;
  jobType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  remoteOption?: 'REMOTE' | 'HYBRID' | 'ONSITE';
  company?: string;
  tags?: string[];
  featured?: boolean;
  page?: number;
  limit?: number;
}

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

  const where: any = { isActive: true };

  if (jobType) {
    where.jobType = jobType;
  }

  if (remoteOption) {
    where.remoteOption = remoteOption;
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  const skip = (page - 1) * limit;
  const jobs = await prisma.jobOpportunity.findMany({
    where,
    skip,
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

  const total = await prisma.jobOpportunity.count({ where });

  let filteredJobs = jobs;

  if (search || location || company || (tags && tags.length > 0)) {
    filteredJobs = jobs.filter(job => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          (job.description?.toLowerCase().includes(searchLower) ?? false) ||
          job.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (location) {
        const locationLower = location.toLowerCase();
        const matchesLocation = 
          job.location.toLowerCase().includes(locationLower) ||
          job.country.toLowerCase().includes(locationLower);
        if (!matchesLocation) return false;
      }

      if (company) {
        if (!job.company.toLowerCase().includes(company.toLowerCase())) return false;
      }

      if (tags && tags.length > 0) {
        const hasAllTags = tags.every(tag => job.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }

  return {
    jobs: filteredJobs,
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
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
  status: 'SUBMITTED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'REJECTED'
) {
  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });
}

export async function getJobApplicationsForAdmin(jobId?: string) {
  const where = jobId ? { jobOpportunityId: jobId } : {};
  return prisma.jobApplication.findMany({
    where,
    include: { user: true, opportunity: true, resume: true },
    orderBy: { submittedAt: 'desc' },
  });
}
