import { prisma } from "@/lib/prisma";
import type { JobType, RemoteOption } from "@prisma/client";

export interface JobUpdateInput {
  title?: string;
  company?: string;
  location?: string;
  country?: string;
  jobType?: JobType;
  remoteOption?: RemoteOption;
  salaryRange?: string;
  description?: string;
  requirements?: string[];
  tags?: string[];
  featured?: boolean;
  isActive?: boolean;
  deadline?: Date | null;
}

/**
 * Update job featured status (admin operation)
 */
export async function setJobFeatured(jobId: string, featured: boolean) {
  if (!jobId) {
    throw new Error("jobId is required");
  }

  return prisma.jobOpportunity.update({
    where: { id: jobId },
    data: { featured },
    select: {
      id: true,
      title: true,
      featured: true,
      updatedAt: true,
    },
  });
}

/**
 * Get featured jobs
 */
export async function getFeaturedJobs(limit = 10) {
  return prisma.jobOpportunity.findMany({
    where: { featured: true, isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      jobType: true,
      salaryRange: true,
      tags: true,
      createdAt: true,
    },
  });
}

/**
 * Get all jobs (paginated)
 */
export async function getAllJobs(options: {
  skip?: number;
  take?: number;
  search?: string;
  featured?: boolean;
  active?: boolean;
  sortBy?: "recent" | "featured" | "views";
} = {}) {
  const skip = options.skip || 0;
  const take = options.take || 20;

  const where: any = {};

  if (options.active !== undefined) {
    where.isActive = options.active;
  }

  if (options.featured !== undefined) {
    where.featured = options.featured;
  }

  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { company: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const orderBy: any = {};
  switch (options.sortBy) {
    case "featured":
      orderBy.featured = "desc";
      break;
    case "views":
      orderBy.viewCount = "desc";
      break;
    default:
      orderBy.createdAt = "desc";
  }

  const [jobs, total] = await Promise.all([
    prisma.jobOpportunity.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        salaryRange: true,
        featured: true,
        isActive: true,
        viewCount: true,
        applicationCount: true,
        createdAt: true,
      },
    }),
    prisma.jobOpportunity.count({ where }),
  ]);

  return {
    jobs,
    total,
    page: Math.floor(skip / take) + 1,
    pages: Math.ceil(total / take),
  };
}

/**
 * Deactivate a job posting
 */
export async function deactivateJob(jobId: string) {
  if (!jobId) {
    throw new Error("jobId is required");
  }

  return prisma.jobOpportunity.update({
    where: { id: jobId },
    data: { isActive: false },
    select: {
      id: true,
      title: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

/**
 * Reactivate a job posting
 */
export async function reactivateJob(jobId: string) {
  if (!jobId) {
    throw new Error("jobId is required");
  }

  return prisma.jobOpportunity.update({
    where: { id: jobId },
    data: { isActive: true },
    select: {
      id: true,
      title: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

/**
 * Delete a job posting
 */
export async function deleteJob(jobId: string) {
  if (!jobId) {
    throw new Error("jobId is required");
  }

  return prisma.jobOpportunity.delete({
    where: { id: jobId },
    select: { id: true, title: true },
  });
}

/**
 * Update job details (admin can update any job, poster can only update their own)
 */
export async function updateJob(jobId: string, data: JobUpdateInput) {
  if (!jobId) {
    throw new Error("jobId is required");
  }

  const update: any = {};

  if (data.title !== undefined) update.title = data.title;
  if (data.company !== undefined) update.company = data.company;
  if (data.location !== undefined) update.location = data.location;
  if (data.country !== undefined) update.country = data.country;
  if (data.jobType !== undefined) update.jobType = data.jobType;
  if (data.remoteOption !== undefined) update.remoteOption = data.remoteOption;
  if (data.salaryRange !== undefined) update.salaryRange = data.salaryRange;
  if (data.description !== undefined) update.description = data.description;
  if (data.requirements !== undefined) update.requirements = data.requirements;
  if (data.tags !== undefined) update.tags = data.tags;
  if (data.featured !== undefined) update.featured = data.featured;
  if (data.isActive !== undefined) update.isActive = data.isActive;
  if (data.deadline !== undefined) update.deadline = data.deadline;

  update.updatedAt = new Date();

  return prisma.jobOpportunity.update({
    where: { id: jobId },
    data: update,
    select: {
      id: true,
      title: true,
      company: true,
      featured: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

/**
 * Get job statistics
 */
export async function getJobStats() {
  const [total, active, featured, totalApplications, avgViewsPerJob] = await Promise.all([
    prisma.jobOpportunity.count(),
    prisma.jobOpportunity.count({ where: { isActive: true } }),
    prisma.jobOpportunity.count({ where: { featured: true } }),
    prisma.jobApplication.count(),
    prisma.jobOpportunity.aggregate({
      _avg: { viewCount: true },
    }),
  ]);

  return {
    totalJobs: total,
    activeJobs: active,
    featuredJobs: featured,
    totalApplications,
    avgViewsPerJob: Math.round(avgViewsPerJob._avg.viewCount || 0),
  };
}

/**
 * Get top jobs by applications
 */
export async function getTopJobsByApplications(limit = 10) {
  return prisma.jobOpportunity.findMany({
    where: { isActive: true },
    orderBy: { applicationCount: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      company: true,
      applicationCount: true,
      viewCount: true,
    },
  });
}

/**
 * Bulk feature/unfeature jobs
 */
export async function bulkUpdateJobFeatured(jobIds: string[], featured: boolean) {
  if (!jobIds || jobIds.length === 0) {
    throw new Error("jobIds array is required");
  }

  return prisma.jobOpportunity.updateMany({
    where: { id: { in: jobIds } },
    data: { featured },
  });
}

/**
 * Get jobs expiring soon
 */
export async function getExpiringJobs(daysThreshold = 7) {
  const expiresAfter = new Date();
  const expiresBefore = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);

  return prisma.jobOpportunity.findMany({
    where: {
      deadline: {
        gte: expiresAfter,
        lte: expiresBefore,
      },
      isActive: true,
    },
    orderBy: { deadline: "asc" },
    select: {
      id: true,
      title: true,
      company: true,
      deadline: true,
      applicationCount: true,
    },
  });
}
