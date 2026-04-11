import { prisma } from "@/lib/prisma";

export async function getStudentEnrollments(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    include: { course: true },
  });
}

export async function getStudentResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
  });
}

export async function getStudentApplications(userId: string) {
  return prisma.jobApplication.findMany({
    where: { userId },
    include: { jobOpportunity: true },
  });
}

export async function listStudentEnrollmentsWithCourses(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    include: { course: true },
  });
}

export async function getDashboardSummary(userId: string) {
  const enrollments = await prisma.enrollment.count({ where: { userId } });
  const resumes = await prisma.resume.count({ where: { userId } });
  const applications = await prisma.jobApplication.count({ where: { userId } });

  return {
    enrollments,
    resumes,
    applications,
  };
}

export async function getTutorDashboardData(userId: string) {
  const courses = await prisma.course.findMany({
    where: { instructorId: userId },
    include: { enrollments: true },
  });

  return {
    courses,
    totalEnrollments: courses.reduce((sum, c) => sum + c.enrollments.length, 0),
  };
}

export async function listRecommendedJobs(userId: string) {
  return [];
}

export async function listSavedJobIds(userId: string) {
  return [];
}

export async function getDashboardInsights(userId: string) {
  return {
    enrollments: 0,
    resumes: 0,
    applications: 0,
  };
}

export async function invalidateDashboardInsights(userId: string) {
  // Placeholder for cache invalidation
  return true;
}

export async function getDashboardSectionsFullCache(userId: string) {
  return {
    enrollments: [],
    resumes: [],
    applications: [],
  };
}
