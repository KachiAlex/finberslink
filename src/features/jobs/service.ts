import * as FirestoreService from "@/lib/firestore-service";

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

  let filterOptions: any = { isActive: true };

  if (jobType) {
    filterOptions.jobType = jobType;
  }

  if (remoteOption) {
    filterOptions.remoteOption = remoteOption;
  }

  if (featured !== undefined) {
    filterOptions.featured = featured;
  }

  const { jobs, total } = await FirestoreService.listJobs(filterOptions, page, limit);

  let filteredJobs = jobs;

  // Client-side filtering for complex queries (search, location, company, tags)
  if (search || location || company || (tags && tags.length > 0)) {
    filteredJobs = jobs.filter(job => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower) ||
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
  const { jobs } = await FirestoreService.listJobs({}, 1, 1000);
  return jobs.find(job => (job as any).slug === slug) || null;
}

export async function getJobById(jobId: string) {
  return FirestoreService.getJobById(jobId);
}

export async function incrementJobViewCount(jobId: string) {
  // TODO: Implement view count tracking once field is added to schema
  return null;
}

export async function getFeaturedJobs(limit = 5) {
  const { jobs } = await FirestoreService.listJobs({ isActive: true, featured: true }, 1, limit);
  return jobs;
}

export async function getRecentJobs(limit = 10) {
  const { jobs } = await FirestoreService.listJobs({ isActive: true }, 1, limit);
  return jobs;
}

export async function getPopularCompanies(limit = 10) {
  const { jobs } = await FirestoreService.listJobs({ isActive: true }, 1, 1000);
  
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
  const { jobs } = await FirestoreService.listJobs({ isActive: true }, 1, 1000);
  
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
  const application = await FirestoreService.createApplication({
    userId: data.userId,
    jobOpportunityId: data.jobOpportunityId,
    resumeId: data.resumeId || '',
    status: 'SUBMITTED',
  });

  return application;
}

export async function getUserJobApplications(userId: string) {
  const { applications } = await FirestoreService.listApplicationsByUser(userId, 1, 100);
  return applications;
}

export async function updateJobApplicationStatus(
  applicationId: string,
  status: 'SUBMITTED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'REJECTED'
) {
  await FirestoreService.updateApplication(applicationId, { status });
  return FirestoreService.getApplicationById(applicationId);
}

export async function getJobApplicationsForAdmin(jobId?: string) {
  const { applications } = await FirestoreService.listApplicationsByJob(jobId || '', 1, 100);
  
  return applications;
}
