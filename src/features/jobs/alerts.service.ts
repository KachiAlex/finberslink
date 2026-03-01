import { prisma } from "@/lib/prisma";
import { JobType } from "@prisma/client";

export interface JobAlertData {
  userId: string;
  keywords: string[];
  location?: string;
  jobType?: JobType;
}

// TODO: Implement once JobAlert model is migrated to database
export async function createJobAlert(data: JobAlertData) {
  // Placeholder - will be implemented after migration
  console.log("Creating job alert:", data);
  return { id: "temp", ...data };
}

export async function getUserJobAlerts(userId: string) {
  // Placeholder - will be implemented after migration
  console.log("Getting job alerts for user:", userId);
  return [];
}

export async function updateJobAlert(
  alertId: string,
  data: Partial<JobAlertData>
) {
  // Placeholder - will be implemented after migration
  console.log("Updating job alert:", alertId, data);
  return { id: alertId, ...data };
}

export async function deleteJobAlert(alertId: string) {
  // Placeholder - will be implemented after migration
  console.log("Deleting job alert:", alertId);
  return { id: alertId };
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
      { title: { contains: alert.keywords[0], mode: "insensitive" } },
      { description: { contains: alert.keywords[0], mode: "insensitive" } },
      { tags: { hasSome: alert.keywords } },
    ];
  }

  if (alert.location) {
    where.location = { contains: alert.location, mode: "insensitive" };
  }

  if (alert.jobType) {
    where.jobType = alert.jobType;
  }

  return prisma.jobOpportunity.findMany({
    where,
    select: {
      id: true,
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
  // TODO: Implement once JobAlert model is migrated
  console.log("Processing job alerts - not yet implemented");
  return [];
}
