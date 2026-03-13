import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export interface DashboardInsight {
  title: string;
  value: number | string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon: string;
  description?: string;
}

/**
 * Get student dashboard insights (courses, progress, achievements)
 */
export async function getStudentDashboardInsights(userId: string) {
  try {
    const [enrollments, recentEnrollments] = await Promise.all([
      prisma.enrollment.count({ where: { userId } }),
      prisma.enrollment.findMany({
        where: { userId, status: "ACTIVE" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true, coverImage: true } },
        },
      }),
    ]);

    const totalProgress =
      recentEnrollments.length > 0
        ? Math.round(
            recentEnrollments.reduce((sum, e) => sum + e.progressPercentage, 0) /
              recentEnrollments.length
          )
        : 0;

    return {
      coursesEnrolled: enrollments,
      activeProgress: totalProgress,
      recentCourses: recentEnrollments.map((e) => ({
        id: e.course.id,
        title: e.course.title,
        progress: e.progressPercentage,
        image: e.course.coverImage,
      })),
    };
  } catch (error) {
    console.error("Error fetching student insights:", error);
    return { coursesEnrolled: 0, activeProgress: 0, recentCourses: [] };
  }
}

/**
 * Get tutor dashboard insights
 */
export async function getTutorDashboardInsights(userId: string) {
  try {
    const [coursesCreated, studentEnrollments] = await Promise.all([
      prisma.course.count({ where: { instructorId: userId } }),
      prisma.enrollment.count({
        where: {
          course: { instructorId: userId },
        },
      }),
    ]);

    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        coverImage: true,
        enrollments: { select: { progressPercentage: true } },
      },
    });

    const avgCompletion =
      courses.length > 0
        ? Math.round(
            courses.reduce(
              (sum, c) =>
                sum +
                (c.enrollments.length > 0
                  ? c.enrollments.reduce((s, e) => s + e.progressPercentage, 0) /
                    c.enrollments.length
                  : 0),
              0
            ) / courses.length
          )
        : 0;

    return {
      coursesCreated,
      studentEnrollments,
      avgCompletion,
      recentCourses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        image: c.coverImage,
      })),
    };
  } catch (error) {
    console.error("Error fetching tutor insights:", error);
    return { coursesCreated: 0, studentEnrollments: 0, avgCompletion: 0, recentCourses: [] };
  }
}

/**
 * Get employer dashboard insights
 */
export async function getEmployerDashboardInsights(userId: string) {
  try {
    const [jobsPosted, totalApplications, offeredCandidates] = await Promise.all([
      prisma.jobOpportunity.count({ where: { postedById: userId, isActive: true } }),
      prisma.jobApplication.count({
        where: {
          opportunity: { postedById: userId },
        },
      }),
      prisma.jobApplication.count({
        where: {
          opportunity: { postedById: userId },
          status: "OFFERED",
        },
      }),
    ]);

    const conversionRate =
      totalApplications > 0
        ? Math.round((offeredCandidates / totalApplications) * 100)
        : 0;

    return {
      jobsPosted,
      applicationsReceived: totalApplications,
      offeredCandidates,
      conversionRate,
    };
  } catch (error) {
    console.error("Error fetching employer insights:", error);
    return {
      jobsPosted: 0,
      applicationsReceived: 0,
      offeredCandidates: 0,
      conversionRate: 0,
    };
  }
}

/**
 * Get admin dashboard insights
 */
export async function getAdminDashboardInsights() {
  try {
    const [totalUsers, activeUsers, totalCourses, totalJobs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.course.count({ where: { lessons: { some: {} } } }),
      prisma.jobOpportunity.count({ where: { isActive: true } }),
    ]);

    return {
      platformMetrics: {
        totalUsers,
        activeUsers,
        totalCourses,
        activeJobs: totalJobs,
      },
    };
  } catch (error) {
    console.error("Error fetching admin insights:", error);
    return {
      platformMetrics: {
        totalUsers: 0,
        activeUsers: 0,
        totalCourses: 0,
        activeJobs: 0,
      },
    };
  }
}

/**
 * Get trending courses
 */
export async function getTrendingCourses(limit: number = 5) {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        enrollments: { _count: "desc" },
      },
      take: limit,
      include: {
        _count: { select: { enrollments: true, lessons: true } },
      },
    });

    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      enrollmentCount: c._count.enrollments,
      lessonCount: c._count.lessons,
    }));
  } catch (error) {
    console.error("Error fetching trending courses:", error);
    return [];
  }
}

/**
 * Get user activity feed
 */
export async function getUserActivityFeed(userId: string, limit: number = 10) {
  try {
    const activities: any[] = [];

    // Course enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { course: { select: { id: true, title: true } } },
    });

    activities.push(
      ...enrollments.map((e) => ({
        type: "ENROLLMENT",
        timestamp: e.createdAt,
        description: `Enrolled in ${e.course.title}`,
        courseId: e.course.id,
      }))
    );

    // Job applications
    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      take: limit,
      orderBy: { submittedAt: "desc" },
      include: {
        opportunity: { select: { id: true, title: true } },
      },
    });

    activities.push(
      ...applications.map((a) => ({
        type: "JOB_APPLICATION",
        timestamp: a.submittedAt,
        description: `Applied for ${a.opportunity.title}`,
        jobId: a.opportunity.id,
      }))
    );

    // Sort by timestamp and return top N
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching user activity feed:", error);
    return [];
  }
}
