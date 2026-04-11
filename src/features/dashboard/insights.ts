import { prisma } from "@/lib/prisma";

export async function getDashboardInsights(userId: string) {
  const enrollments = await prisma.enrollment.count({ where: { userId } });
  const resumes = await prisma.resume.count({ where: { userId } });
  const applications = await prisma.jobApplication.count({ where: { userId } });

  return {
    enrollments,
    resumes,
    applications,
  };
}

export async function getUserActivityFeed(userId: string) {
  return [];
}

export async function invalidateDashboardInsights(userId: string) {
  return true;
}
