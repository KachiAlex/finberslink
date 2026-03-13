import { prisma } from "@/lib/prisma";
import type { JobType } from "@prisma/client";

export interface JobAlertData {
  userId: string;
  keywords: string[];
  location?: string | null;
  jobType?: JobType | null;
}

export interface JobAlertFilters {
  keywords: string[];
  location?: string | null;
  jobType?: JobType | null;
}

/**
 * Create a new job alert for a user
 */
export async function createJobAlert(data: JobAlertData) {
  if (!data.userId) {
    throw new Error("userId is required");
  }

  if (!data.keywords || data.keywords.length === 0) {
    throw new Error("At least one keyword is required");
  }

  return prisma.jobAlert.create({
    data: {
      userId: data.userId,
      keywords: data.keywords.map((k) => k.toLowerCase().trim()),
      location: data.location,
      jobType: data.jobType,
      isActive: true,
    },
  });
}

/**
 * Get all active job alerts for a user
 */
export async function getUserJobAlerts(userId: string) {
  if (!userId) {
    throw new Error("userId is required");
  }

  return prisma.jobAlert.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single job alert by ID
 */
export async function getJobAlertById(alertId: string) {
  if (!alertId) {
    throw new Error("alertId is required");
  }

  return prisma.jobAlert.findUnique({
    where: { id: alertId },
  });
}

/**
 * Update a job alert
 */
export async function updateJobAlert(alertId: string, data: Partial<JobAlertData>) {
  if (!alertId) {
    throw new Error("alertId is required");
  }

  const update: any = {};

  if (data.keywords && data.keywords.length > 0) {
    update.keywords = data.keywords.map((k) => k.toLowerCase().trim());
  }

  if (data.location !== undefined) {
    update.location = data.location;
  }

  if (data.jobType !== undefined) {
    update.jobType = data.jobType;
  }

  return prisma.jobAlert.update({
    where: { id: alertId },
    data: update,
  });
}

/**
 * Delete a job alert (soft delete)
 */
export async function deleteJobAlert(alertId: string) {
  if (!alertId) {
    throw new Error("alertId is required");
  }

  return prisma.jobAlert.update({
    where: { id: alertId },
    data: { isActive: false },
  });
}

/**
 * Permanently delete a job alert
 */
export async function permanentlyDeleteJobAlert(alertId: string) {
  if (!alertId) {
    throw new Error("alertId is required");
  }

  return prisma.jobAlert.delete({
    where: { id: alertId },
  });
}

/**
 * Find jobs matching the given alert criteria
 */
export async function findMatchingJobs(alert: JobAlertFilters, limit = 20) {
  const where: any = {
    isActive: true,
  };

  // Match keywords in title, company, or description
  if (alert.keywords && alert.keywords.length > 0) {
    const keywordPatterns = alert.keywords.map((k) => k.toLowerCase().trim());
    where.OR = [
      {
        title: {
          search: keywordPatterns.join(" | "),
        },
      },
      {
        company: {
          search: keywordPatterns.join(" | "),
        },
      },
      {
        description: {
          search: keywordPatterns.join(" | "),
        },
      },
      {
        tags: {
          hasSome: keywordPatterns,
        },
      },
    ];
  }

  // Filter by location
  if (alert.location) {
    if (!where.AND) {
      where.AND = [];
    }
    where.AND.push({
      location: {
        contains: alert.location,
        mode: "insensitive",
      },
    });
  }

  // Filter by job type
  if (alert.jobType) {
    if (!where.AND) {
      where.AND = [];
    }
    where.AND.push({
      jobType: alert.jobType,
    });
  }

  try {
    return await prisma.jobOpportunity.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        salaryRange: true,
        remoteOption: true,
        tags: true,
        createdAt: true,
        featured: true,
      },
    });
  } catch (error) {
    // If full-text search not supported, fall back to simple pattern matching
    console.warn("Full-text search not available, using fallback...", error);

    return await prisma.jobOpportunity.findMany({
      where: {
        isActive: true,
        location: alert.location ? { contains: alert.location, mode: "insensitive" } : undefined,
        jobType: alert.jobType,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        salaryRange: true,
        remoteOption: true,
        tags: true,
        createdAt: true,
        featured: true,
      },
    });
  }
}

/**
 * Process all active job alerts and notify users of matching jobs
 * This would typically be called by a cron job
 */
export async function processJobAlerts() {
  try {
    const alerts = await prisma.jobAlert.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { 
            id: true, 
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const results = [];

    for (const alert of alerts) {
      try {
        const matchingJobs = await findMatchingJobs(
          {
            keywords: alert.keywords,
            location: alert.location,
            jobType: alert.jobType,
          },
          50
        );

        if (matchingJobs.length > 0) {
          // TODO: Send email notification to user about matching jobs
          results.push({
            alertId: alert.id,
            userId: alert.user.id,
            matchCount: matchingJobs.length,
            success: true,
          });
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        results.push({
          alertId: alert.id,
          userId: alert.user.id,
          matchCount: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      totalAlerts: alerts.length,
      processedAlerts: results.length,
      results,
    };
  } catch (error) {
    console.error("Error processing job alerts:", error);
    throw error;
  }
}

/**
 * Get suggested keywords based on user's saved jobs and applications
 */
export async function getSuggestedKeywords(userId: string) {
  if (!userId) {
    throw new Error("userId is required");
  }

  // Get keywords from user's saved jobs
  const savedJobs = await prisma.jobSave.findMany({
    where: { userId },
    include: {
      job: {
        select: { tags: true, title: true },
      },
    },
    take: 10,
  });

  // Get keywords from user's applications
  const applications = await prisma.jobApplication.findMany({
    where: { userId },
    include: {
      job: {
        select: { tags: true, title: true },
      },
    },
    take: 10,
  });

  // Collect and deduplicate keywords
  const keywordSet = new Set<string>();

  [...savedJobs, ...applications].forEach((item: any) => {
    if (item.job.tags) {
      item.job.tags.forEach((tag: string) => {
        keywordSet.add(tag.toLowerCase());
      });
    }
  });

  return Array.from(keywordSet).sort();
}
