import { prisma } from "@/lib/prisma";

export async function getStudentEnrollments(userId: string, limit?: number) {
  // Avoid include: { course: true } to prevent Prisma 5.22 engine PANIC
  // when running multiple parallel queries in Promise.all
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      progressPercentage: true,
      lastAccessedAt: true,
      completedAt: true,
      totalStudyTime: true,
      streakDays: true,
      averageScore: true,
      engagementScore: true,
      lastStreakDate: true,
      createdAt: true,
      updatedAt: true,
    },
    take: limit ?? 10,
    orderBy: { createdAt: "desc" },
  });

  if (enrollments.length === 0) return [];

  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      slug: true,
      title: true,
      tagline: true,
      description: true,
      level: true,
      category: true,
      coverImage: true,
      approvalStatus: true,
      publishedAt: true,
      instructorId: true,
    },
  });

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  return enrollments.map((e) => ({ ...e, course: courseMap.get(e.courseId) ?? null }));
}

export async function getStudentResumes(userId: string, limit?: number) {
  return prisma.resume.findMany({
    where: { userId },
    take: limit ?? 10,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getStudentApplications(userId: string, _limits?: { jobsLimit?: number; volunteerLimit?: number }) {
  const jobs = await prisma.jobApplication.findMany({
    where: { userId },
    include: { opportunity: true },
    take: _limits?.jobsLimit ?? 10,
    orderBy: { submittedAt: "desc" },
  });
  return { jobs, volunteer: [] };
}

export async function listStudentEnrollmentsWithCourses(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      progressPercentage: true,
      lastAccessedAt: true,
      completedAt: true,
      totalStudyTime: true,
      streakDays: true,
      averageScore: true,
      engagementScore: true,
      lastStreakDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (enrollments.length === 0) return [];

  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      slug: true,
      title: true,
      tagline: true,
      description: true,
      level: true,
      category: true,
      coverImage: true,
      approvalStatus: true,
      publishedAt: true,
      instructorId: true,
    },
  });

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  return enrollments.map((e) => ({ ...e, course: courseMap.get(e.courseId) ?? null }));
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

export async function listRecommendedJobs(_limit?: number) {
  return [];
}

export async function listSavedJobIds(_userId: string, _limit?: number) {
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
