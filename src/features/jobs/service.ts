import type { JobApplicationStatus, JobOpportunity, JobType, RemoteOption } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { invalidateDashboardInsights } from "../dashboard/service";

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
  // Advanced filters
  minSalary?: number;
  maxSalary?: number;
  experienceLevel?: 'ENTRY' | 'MID' | 'SENIOR' | 'EXECUTIVE';
  companySize?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  industry?: string[];
  postedWithin?: '24H' | '3D' | '1W' | '1M';
  benefits?: string[];
  commuteTime?: number; // in minutes
  educationLevel?: 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'PHD';
}

type JobWhereInput = any;

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

  // Advanced filtering
  if (filters.minSalary || filters.maxSalary) {
    where.salaryRange = {};
    if (filters.minSalary) {
      where.salaryRange.gte = filters.minSalary.toString();
    }
    if (filters.maxSalary) {
      where.salaryRange.lte = filters.maxSalary.toString();
    }
  }

  if (filters.experienceLevel) {
    where.experienceLevel = filters.experienceLevel;
  }

  if (filters.companySize) {
    where.companySize = filters.companySize;
  }

  if (filters.industry && filters.industry.length > 0) {
    where.industry = { hasSome: filters.industry };
  }

  if (filters.benefits && filters.benefits.length > 0) {
    where.benefits = { hasSome: filters.benefits };
  }

  if (filters.educationLevel) {
    where.educationLevel = filters.educationLevel;
  }

  // Posted within filter
  if (filters.postedWithin) {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (filters.postedWithin) {
      case '24H':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '3D':
        cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '1W':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    where.createdAt = { gte: cutoffDate };
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
  
  const allTags = jobs.flatMap(job => (job.tags ?? [])).filter((tag) => tag && tag.length > 0) as string[];
  const tagCounts = allTags.reduce<Record<string, number>>((acc: Record<string, number>, tag: string) => {
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
  const application = await prisma.jobApplication.create({
    data: {
      userId: data.userId,
      jobOpportunityId: data.jobOpportunityId,
      resumeId: data.resumeId,
      coverLetter: data.coverLetter,
      status: 'SUBMITTED',
    },
  });

  await invalidateDashboardInsights(data.userId);

  return application;
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
  const application = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });

  await invalidateDashboardInsights(application.userId);

  return application;
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
    include: {
      user: { 
        include: { 
          profile: {
            select: {
              headline: true,
              bio: true,
              location: true,
              certifications: true,
              education: true,
              skills: true,
              interests: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
      opportunity: true,
      resume: true,
    },
    orderBy: { submittedAt: 'desc' },
  });
}

// Helper functions for advanced filtering
export function parseSalaryRange(salaryRange: string): { min?: number; max?: number } | null {
  if (!salaryRange) return null;
  
  // Handle various formats: "50k-80k", "$50,000 - $80,000", "50000-80000"
  const cleaned = salaryRange.replace(/[^0-9kK-]/g, '');
  const parts = cleaned.split('-');
  
  if (parts.length === 2) {
    const min = parseSalaryValue(parts[0]);
    const max = parseSalaryValue(parts[1]);
    
    if (min !== null && max !== null) {
      return { min, max };
    }
  }
  
  return null;
}

function parseSalaryValue(value: string): number | null {
  if (!value) return null;
  
  const num = parseInt(value.replace(/[^0-9]/g, ''));
  if (isNaN(num)) return null;
  
  // Handle 'k' suffix (thousands)
  if (value.toLowerCase().includes('k')) {
    return num * 1000;
  }
  
  return num;
}

export function getSalaryRangeFilters(): Array<{ label: string; min: number; max: number }> {
  return [
    { label: 'Under $40k', min: 0, max: 40000 },
    { label: '$40k - $60k', min: 40000, max: 60000 },
    { label: '$60k - $80k', min: 60000, max: 80000 },
    { label: '$80k - $100k', min: 80000, max: 100000 },
    { label: '$100k - $150k', min: 100000, max: 150000 },
    { label: '$150k - $200k', min: 150000, max: 200000 },
    { label: 'Over $200k', min: 200000, max: 1000000 },
  ];
}

export function getIndustries(): Array<{ value: string; label: string; count: number }> {
  return [
    { value: 'technology', label: 'Technology', count: 1250 },
    { value: 'healthcare', label: 'Healthcare', count: 890 },
    { value: 'finance', label: 'Finance', count: 756 },
    { value: 'education', label: 'Education', count: 634 },
    { value: 'retail', label: 'Retail', count: 512 },
    { value: 'manufacturing', label: 'Manufacturing', count: 445 },
    { value: 'consulting', label: 'Consulting', count: 389 },
    { value: 'marketing', label: 'Marketing', count: 367 },
    { value: 'nonprofit', label: 'Non-Profit', count: 234 },
    { value: 'government', label: 'Government', count: 189 },
  ];
}

export function getBenefits(): Array<{ value: string; label: string }> {
  return [
    { value: 'health_insurance', label: 'Health Insurance' },
    { value: 'dental_vision', label: 'Dental & Vision' },
    { value: 'retirement_401k', label: '401(k) Retirement' },
    { value: 'paid_time_off', label: 'Paid Time Off' },
    { value: 'remote_work', label: 'Remote Work' },
    { value: 'flexible_hours', label: 'Flexible Hours' },
    { value: 'gym_membership', label: 'Gym Membership' },
    { value: 'professional_development', label: 'Professional Development' },
    { value: 'parental_leave', label: 'Parental Leave' },
    { value: 'stock_options', label: 'Stock Options' },
  ];
}

export function getCompanySizes(): Array<{ value: string; label: string; description: string }> {
  return [
    { value: 'SMALL', label: 'Small', description: '1-50 employees' },
    { value: 'MEDIUM', label: 'Medium', description: '51-500 employees' },
    { value: 'LARGE', label: 'Large', description: '501-5000 employees' },
    { value: 'ENTERPRISE', label: 'Enterprise', description: '5000+ employees' },
  ];
}

export function getExperienceLevels(): Array<{ value: string; label: string; years: string }> {
  return [
    { value: 'ENTRY', label: 'Entry Level', years: '0-2 years' },
    { value: 'MID', label: 'Mid Level', years: '3-5 years' },
    { value: 'SENIOR', label: 'Senior Level', years: '6-10 years' },
    { value: 'EXECUTIVE', label: 'Executive', years: '10+ years' },
  ];
}


export async function getUserSavedJobs(userId: string) {
  return prisma.jobSave.findMany({
    where: { userId },
    include: { jobOpportunity: true },
  });
}
