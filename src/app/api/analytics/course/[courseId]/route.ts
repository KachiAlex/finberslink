import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth/guards";
import { prisma } from "../../../../../lib/prisma";
import { createRateLimit, rateLimitPresets } from "../../../../../lib/security/rate-limit";

export const runtime = "nodejs";

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/analytics/course/[courseId]
 * Get course analytics for instructors
 */
export const GET = rateLimitMiddleware(async (
  request: NextRequest,
  { params }: { params: { courseId: string } }
) => {
  try {
    const session = requireAuth(request);
    const { courseId } = params;

    // Verify user is instructor or admin for this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { instructorId: session.sub },
          { instructor: { role: "ADMIN" } },
        ],
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Not authorized to view analytics for this course" },
        { status: 403 }
      );
    }

    // Get enrollment analytics
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
        lessonProgress: true,
      },
    });

    // Calculate overall metrics
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(e => 
      e.lastAccessedAt && 
      new Date(e.lastAccessedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const completedEnrollments = enrollments.filter(e => e.progressPercentage >= 100).length;
    const averageProgress = totalEnrollments > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / totalEnrollments)
      : 0;

    // Calculate engagement metrics
    const totalStudyTime = enrollments.reduce((sum, e) => sum + e.totalStudyTime, 0);
    const averageStudyTime = totalEnrollments > 0 ? Math.round(totalStudyTime / totalEnrollments) : 0;
    const averageStreakDays = totalEnrollments > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + e.streakDays, 0) / totalEnrollments)
      : 0;

    // Get lesson-specific analytics
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      include: {
        lessonProgress: {
          include: {
            enrollment: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const lessonAnalytics = lessons.map(lesson => {
      const progress = lesson.lessonProgress;
      const completed = progress.filter(lp => lp.status === "COMPLETED").length;
      const inProgress = progress.filter(lp => lp.status === "IN_PROGRESS").length;
      const notStarted = progress.filter(lp => lp.status === "NOT_STARTED").length;
      const averageScore = progress
        .filter(lp => lp.completionScore !== null)
        .reduce((sum, lp) => sum + lp.completionScore!, 0) / 
        progress.filter(lp => lp.completionScore !== null).length || 0;
      const averageTimeSpent = progress.reduce((sum, lp) => sum + lp.timeSpentMinutes, 0) / progress.length || 0;

      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        format: lesson.format,
        totalStudents: progress.length,
        completed,
        inProgress,
        notStarted,
        completionRate: progress.length > 0 ? (completed / progress.length) * 100 : 0,
        averageScore: Math.round(averageScore),
        averageTimeSpent: Math.round(averageTimeSpent),
        difficulty: averageTimeSpent > lesson.durationMinutes * 1.5 ? "Hard" : 
                    averageTimeSpent < lesson.durationMinutes * 0.5 ? "Easy" : "Medium",
      };
    });

    // Get progress distribution
    const progressDistribution = [
      { range: "0-25%", count: enrollments.filter(e => e.progressPercentage <= 25).length },
      { range: "26-50%", count: enrollments.filter(e => e.progressPercentage > 25 && e.progressPercentage <= 50).length },
      { range: "51-75%", count: enrollments.filter(e => e.progressPercentage > 50 && e.progressPercentage <= 75).length },
      { range: "76-99%", count: enrollments.filter(e => e.progressPercentage > 75 && e.progressPercentage < 100).length },
      { range: "100%", count: enrollments.filter(e => e.progressPercentage >= 100).length },
    ];

    // Get enrollment trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const enrollmentTrends = await prisma.enrollment.findMany({
      where: {
        courseId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "asc" },
    });

    const dailyEnrollments = enrollmentTrends.reduce((acc, enrollment) => {
      const date = enrollment.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get at-risk students
    const atRiskStudents = enrollments.filter(enrollment => {
      const daysSinceLastAccess = enrollment.lastAccessedAt
        ? Math.floor((Date.now() - enrollment.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      return (
        daysSinceLastAccess > 7 || // No access for over a week
        enrollment.progressPercentage < 25 || // Less than 25% progress
        (enrollment.streakDays === 0 && enrollment.createdAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // No streak after a week
      );
    }).map(enrollment => ({
      user: enrollment.user,
      enrollment: {
        progressPercentage: enrollment.progressPercentage,
        streakDays: enrollment.streakDays,
        lastAccessedAt: enrollment.lastAccessedAt,
        totalStudyTime: enrollment.totalStudyTime,
      },
      riskFactors: {
        inactiveForDays: enrollment.lastAccessedAt
          ? Math.floor((Date.now() - enrollment.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        lowProgress: enrollment.progressPercentage < 25,
        noStreak: enrollment.streakDays === 0,
      },
    }));

    // Get top performers
    const topPerformers = enrollments
      .filter(e => e.progressPercentage > 50)
      .sort((a, b) => b.progressPercentage - a.progressPercentage)
      .slice(0, 10)
      .map(enrollment => ({
        user: enrollment.user,
        progressPercentage: enrollment.progressPercentage,
        totalStudyTime: enrollment.totalStudyTime,
        streakDays: enrollment.streakDays,
        averageScore: enrollment.lessonProgress
          .filter(lp => lp.completionScore !== null)
          .reduce((sum, lp) => sum + lp.completionScore!, 0) / 
          enrollment.lessonProgress.filter(lp => lp.completionScore !== null).length || 0,
      }));

    return NextResponse.json({
      data: {
        overview: {
          totalEnrollments,
          activeEnrollments,
          completedEnrollments,
          averageProgress,
          totalStudyTime,
          averageStudyTime,
          averageStreakDays,
          completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
        },
        lessons: lessonAnalytics,
        progressDistribution,
        enrollmentTrends: Object.entries(dailyEnrollments).map(([date, count]) => ({
          date,
          enrollments: count,
        })),
        atRiskStudents,
        topPerformers,
      },
    });
  } catch (error) {
    console.error("Failed to get course analytics:", error);
    return NextResponse.json(
      { error: "Failed to get course analytics" },
      { status: 500 }
    );
  }
});
