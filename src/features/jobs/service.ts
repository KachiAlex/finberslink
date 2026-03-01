import { prisma } from "@/lib/prisma";
import { JobType, RemoteOption, JobApplicationStatus } from "@prisma/client";

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

  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

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
      ...(where.OR || []),
      { location: { contains: location, mode: "insensitive" } },
      { country: { contains: location, mode: "insensitive" } },
    ];
  }

  if (jobType) {
    where.jobType = jobType;
  }

  if (remoteOption) {
    where.remoteOption = remoteOption;
  }

  if (company) {
    where.company = { contains: company, mode: "insensitive" };
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  const [jobs, total] = await Promise.all([
    prisma.jobOpportunity.findMany({
      where,
      include: {
        postedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.jobOpportunity.count({ where }),
  ]);

  const processedJobs = jobs
    .filter(job => job.slug !== null)
    .map(job => ({
      ...job,
      slug: job.slug!,
      salaryRange: job.salaryRange || undefined,
      description: job.description || undefined,
      createdAt: job.createdAt.toISOString(),
    }));

  return {
    jobs: processedJobs,
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
    where: { slug },
    include: {
      postedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });
}

export async function getJobById(jobId: string) {
  return prisma.jobOpportunity.findUnique({
    where: { id: jobId },
    include: {
      postedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });
}

export async function incrementJobViewCount(jobId: string) {
  // TODO: Implement view count tracking once field is added to schema
  return null;
}

export async function getFeaturedJobs(limit = 5) {
  const jobs = await prisma.jobOpportunity.findMany({
    where: {
      isActive: true,
    },
    include: {
      postedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit * 2,
  });

  return jobs
    .filter(job => job.slug !== null)
    .slice(0, limit)
    .map(job => ({
      ...job,
      slug: job.slug!,
      salaryRange: job.salaryRange || undefined,
      description: job.description || undefined,
      createdAt: job.createdAt.toISOString(),
    }));
}

export async function getRecentJobs(limit = 10) {
  return prisma.jobOpportunity.findMany({
    where: {
      isActive: true,
    },
    include: {
      postedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

export async function getPopularCompanies(limit = 10) {
  const companies = await prisma.jobOpportunity.groupBy({
    by: ["company"],
    where: {
      isActive: true,
    },
    _count: {
      company: true,
    },
    orderBy: {
      _count: {
        company: "desc",
      },
    },
    take: limit,
  });

  return companies.map(item => ({
    name: item.company,
    jobCount: item._count.company,
  }));
}

export async function getJobTags() {
  const tags = await prisma.jobOpportunity.findMany({
    where: {
      isActive: true,
      tags: {
        not: [],
      },
    },
    select: {
      tags: true,
    },
  });

  const allTags = tags.flatMap(job => job.tags);
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
  const application = await prisma.jobApplication.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      opportunity: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
  });

  // TODO: Update application count once field is added to schema

  return application;
}

export async function getUserJobApplications(userId: string) {
  return prisma.jobApplication.findMany({
    where: { userId },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          remoteOption: true,
          salaryRange: true,
          slug: true,
        },
      },
      resume: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });
}

export async function updateJobApplicationStatus(
  applicationId: string,
  status: JobApplicationStatus
) {
  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      opportunity: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
  });
}

export async function getJobApplicationsForAdmin(jobId?: string) {
  const where = jobId ? { jobOpportunityId: jobId } : {};
  
  return prisma.jobApplication.findMany({
    where,
    select: {
      id: true,
      userId: true,
      jobOpportunityId: true,
      resumeId: true,
      status: true,
      coverLetter: true,
      submittedAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profile: {
            select: {
              headline: true,
              location: true,
            },
          },
        },
      },
      opportunity: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
        },
      },
      resume: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });
}
