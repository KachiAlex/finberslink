import { prisma } from "@/lib/prisma";

export async function getJobAlert(alertId: string) {
  return prisma.jobAlert.findUnique({
    where: { id: alertId },
  });
}

export async function updateJobAlert(alertId: string, data: any) {
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

export async function listJobAlerts(userId: string) {
  return prisma.jobAlert.findMany({
    where: { userId },
  });
}


export async function getJobAlertById(alertId: string) {
  return getJobAlert(alertId);
}

export async function findMatchingJobs(alertId: string) {
  const alert = await getJobAlert(alertId);
  if (!alert) return [];
  
  return prisma.job.findMany({
    where: {
      title: { contains: alert.keywords },
    },
  });
}

export async function createJobAlert(userId: string, data: any) {
  return prisma.jobAlert.create({
    data: { userId, ...data },
  });
}

export async function createJobPosting(data: any) {
  return prisma.job.create({
    data,
  });
}

export async function getUserJobAlerts(userId: string) {
  return prisma.jobAlert.findMany({
    where: { userId },
  });
}
