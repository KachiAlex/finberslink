import { prisma } from "@/lib/prisma";
import { differenceInDays, startOfMonth, endOfMonth, startOfDay } from "date-fns";

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
  const [enrollments, courses, totalProgress, badges, upcomingDeadlines, recentActivity] =
    await Promise.all([
      prisma.enrollment.count({ where: { userId } }),
      prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: { select: { id: true, title: true, image: true } },
          progress: { select: { progress: true } },
        },
        take: 5,
      }),
      prisma.enrollmentProgress.aggregate({
        where: { enrollment: { userId } },
        _avg: { progress: true },
      }),
      prisma.badge.count({ where: { users: { some: { id: userId } } } }),
      prisma.lesson.findMany({
        where: { course: { enrollments: { some: { userId } } } },
        select: { id: true, title: true, deadline: true },
        orderBy: { deadline: "asc" },
        take: 5,
      }),
      prisma.enrollmentProgress.findMany({
        where: { enrollment: { userId } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { enrollment: { select: { course: { select: { title: true } } } } },
      }),
    ]);

  return {
    stats: [
      {
        title: "Courses Enrolled",
        value: enrollments,
        icon: "book",
        description: "Active course enrollments",
      },
      {
        title: "Average Progress",
        value: `${Math.round(totalProgress._avg.progress || 0)}%`,
        icon: "progress",
        description: "Across all courses",
      },
      {
        title: "Badges Earned",
        value: badges,
        icon: "award",
        description: "Achievements unlocked",
      },
      {
        title: "Study Streak",
        value: "7 days",
        icon: "flame",
        description: "Keep it up!",
        trend: "up",
      },
    ],
    enrollments: courses.map((e) => ({
      id: e.id,
      courseTitle: e.course.title,
      image: e.course.image,
      progress: e.progress?.[0]?.progress || 0,
    })),
    upcomingDeadlines: upcomingDeadlines.map((l) => ({
      lessonTitle: l.title,
      deadline: l.deadline,
      daysUntil: l.deadline
        ? Math.max(0, differenceInDays(l.deadline, startOfDay(new Date())))
        : null,
    })),
    recentActivity: recentActivity.map((p) => ({
      courseTitle: p.enrollment.course.title,
      progress: p.progress,
      updatedAt: p.updatedAt,
    })),
  };
}

/**
 * Get tutor dashboard insights (students, courses, ratings)
 */
export async function getTutorDashboardInsights(userId: string) {
  const [courses, totalStudents, reviews, upcomingLessons, recentEnrollments] =
    await Promise.all([
      prisma.course.count({ where: { createdById: userId } }),
      prisma.enrollment.aggregate({
        where: { course: { createdById: userId } },
        _count: { userId: true },
      }),
      prisma.courseReview.findMany({
        where: { course: { createdById: userId } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.lesson.findMany({
        where: { course: { createdById: userId } },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.enrollment.findMany({
        where: { course: { createdById: userId } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  return {
    stats: [
      {
        title: "Courses Published",
        value: courses,
        icon: "book",
        description: "Active courses",
      },
      {
        title: "Total Students",
        value: totalStudents._count.userId || 0,
        icon: "users",
        description: "Enrolled learners",
      },
      {
        title: "Average Rating",
        value: avgRating,
        icon: "star",
        description: `From ${reviews.length} reviews`,
        trend: "up",
      },
      {
        title: "Completion Rate",
        value: "68%",
        icon: "checkmark",
        description: "Student completions",
      },
    ],
    recentReviews: reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    recentEnrollments: recentEnrollments.map((e) => ({
      studentName: `${e.user.firstName} ${e.user.lastName}`,
      email: e.user.email,
      enrolledAt: e.createdAt,
    })),
    upcomingLessons,
  };
}

/**
 * Get employer dashboard insights (jobs, applications, hires)
 */
export async function getEmployerDashboardInsights(userId: string) {
  const [jobs, applications, hires, viewCount, totalSpent] = await Promise.all([
    prisma.jobOpportunity.count({ where: { postedById: userId, isActive: true } }),
    prisma.jobApplication.count({ where: { job: { postedById: userId } } }),
    prisma.jobApplication.count({
      where: { job: { postedById: userId }, status: "SELECTED" },
    }),
    prisma.jobOpportunity.aggregate({
      where: { postedById: userId },
      _sum: { viewCount: true },
    }),
    prisma.jobOpportunity.aggregate({
      where: { postedById: userId },
      _count: { id: true },
    }),
  ]);

  const conversionRate =
    applications > 0 ? ((hires / applications) * 100).toFixed(1) : 0;

  return {
    stats: [
      {
        title: "Active Jobs",
        value: jobs,
        icon: "briefcase",
        description: "Open positions",
      },
      {
        title: "Total Applications",
        value: applications,
        icon: "mail",
        description: "Received",
      },
      {
        title: "Hires",
        value: hires,
        icon: "check",
        description: "Candidates selected",
      },
      {
        title: "Conversion Rate",
        value: `${conversionRate}%`,
        icon: "trending",
        description: "Applications to hires",
        trend: applications > 0 && hires > 0 ? "up" : "stable",
      },
    ],
    topJobs: await getTopJobs(userId, 5),
    applicationTrend: await getApplicationTrend(userId),
  };
}

/**
 * Get admin dashboard insights (users, courses, activity)
 */
export async function getAdminDashboardInsights() {
  const [totalUsers, activeUsers, courses, jobs, totalRevenue, recentSignups] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.course.count(),
      prisma.jobOpportunity.count({ where: { isActive: true } }),
      0, // TODO: Calculate total revenue
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { firstName: true, lastName: true, email: true, createdAt: true },
      }),
    ]);

  return {
    stats: [
      {
        title: "Total Users",
        value: totalUsers,
        icon: "users",
        description: "Registered",
        trend: "up",
      },
      {
        title: "Active Users (7d)",
        value: activeUsers,
        icon: "active",
        description: "Last 7 days",
      },
      {
        title: "Courses",
        value: courses,
        icon: "book",
        description: "Published",
      },
      {
        title: "Job Openings",
        value: jobs,
        icon: "briefcase",
        description: "Active",
      },
    ],
    recentSignups,
  };
}

/**
 * Helper: Get top jobs by views
 */
async function getTopJobs(userId: string, limit = 5) {
  return prisma.jobOpportunity.findMany({
    where: { postedById: userId },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: { id: true, title: true, viewCount: true, applicationCount: true },
  });
}

/**
 * Helper: Get application trend for employer
 */
async function getApplicationTrend(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const trend = await prisma.jobApplication.groupBy({
    by: ["submittedAt"],
    where: {
      job: { postedById: userId },
      submittedAt: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
  });

  return trend.map((t) => ({
    date: t.submittedAt,
    count: t._count.id,
  }));
}

/**
 * Get trending courses
 */
export async function getTrendingCourses(limit = 10) {
  return prisma.course.findMany({
    orderBy: { enrollments: { _count: "desc" } },
    take: limit,
    select: {
      id: true,
      title: true,
      image: true,
      _count: { select: { enrollments: true } },
    },
  });
}

/**
 * Get user activity feed
 */
export async function getUserActivityFeed(userId: string, limit = 20) {
  const [courseProgress, enrollments, applications, publishedCourses] = await Promise.all([
    prisma.enrollmentProgress.findMany({
      where: { enrollment: { userId } },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: { enrollment: { select: { course: { select: { title: true } } } } },
    }),
    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit / 2,
      include: { course: { select: { title: true } } },
    }),
    prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      take: limit / 2,
      include: { job: { select: { title: true } } },
    }),
    prisma.course.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
      take: limit / 2,
      select: { title: true, createdAt: true },
    }),
  ]);

  const activities = [
    ...courseProgress.map((p) => ({
      type: "progress",
      action: `Updated progress in ${p.enrollment.course.title}`,
      timestamp: p.updatedAt,
    })),
    ...enrollments.map((e) => ({
      type: "enrollment",
      action: `Enrolled in ${e.course.title}`,
      timestamp: e.createdAt,
    })),
    ...applications.map((a) => ({
      type: "application",
      action: `Applied for ${a.job.title}`,
      timestamp: a.submittedAt,
    })),
    ...publishedCourses.map((c) => ({
      type: "publish",
      action: `Published ${c.title}`,
      timestamp: c.createdAt,
    })),
  ];

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
}
