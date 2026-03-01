import { prisma } from "@/lib/prisma";
import { JobType } from "@prisma/client";

export async function createJobAlert(data: {
  userId: string;
  keywords: string[];
  location?: string;
  jobType?: JobType;
}) {
  return prisma.jobAlert.create({
    data,
  });
}

export async function getUserJobAlerts(userId: string) {
  return prisma.jobAlert.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateJobAlert(
  alertId: string,
  data: {
    keywords?: string[];
    location?: string;
    jobType?: JobType;
    isActive?: boolean;
  }
) {
  return prisma.jobAlert.update({
    where: { id: alertId },
    data,
  });
}

export async function deleteJobAlert(alertId: string) {
  return prisma.jobAlert.delete({
    where: { id: alertId },
  });
}

export async function findMatchingJobs(alert: {
  keywords: string[];
  location?: string;
  jobType?: JobType;
}) {
  const where: any = {
    isActive: true,
  };

  if (alert.keywords && alert.keywords.length > 0) {
    where.OR = [
      { title: { search: alert.keywords.join(" | "), mode: "insensitive" } },
      { description: { search: alert.keywords.join(" | "), mode: "insensitive" } },
      { tags: { hasSome: alert.keywords } },
    ];
  }

  if (alert.location) {
    where.OR = [
      ...(where.OR || []),
      { location: { contains: alert.location, mode: "insensitive" } },
      { country: { contains: alert.location, mode: "insensitive" } },
    ];
  }

  if (alert.jobType) {
    where.jobType = alert.jobType;
  }

  return prisma.jobOpportunity.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      company: true,
      location: true,
      jobType: true,
      remoteOption: true,
      salaryRange: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function processJobAlerts() {
  // This function would be called by a cron job to process alerts and send notifications
  const alerts = await prisma.jobAlert.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      },
    },
  });

  const results = [];

  for (const alert of alerts) {
    const matchingJobs = await findMatchingJobs({
      keywords: alert.keywords,
      location: alert.location || undefined,
      jobType: alert.jobType || undefined,
    });

    if (matchingJobs.length > 0) {
      // TODO: Send email notification to user
      results.push({
        alertId: alert.id,
        userId: alert.user.id,
        email: alert.user.email,
        matchingJobsCount: matchingJobs.length,
        jobs: matchingJobs,
      });
    }
  }

  return results;
}
