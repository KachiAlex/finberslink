import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/courses/[courseId]/progress
 * Get comprehensive course progress for current user
 */
export const GET = rateLimitMiddleware(async (
  request: NextRequest,
  { params }: { params: { courseId: string } }
) => {
  try {
    const session = requireAuth(request);
    const { courseId } = params;

    // Get enrollment with detailed progress
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.sub,
        courseId,
      },
      include: {
        course: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
        lessonProgress: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                order: true,
                durationMinutes: true,
                format: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Calculate detailed progress metrics
    const totalLessons = enrollment.course.lessons.length;
    const completedLessons = enrollment.lessonProgress.filter(
      (lp) => lp.status === "COMPLETED"
    ).length;
    const inProgressLessons = enrollment.lessonProgress.filter(
      (lp) => lp.status === "IN_PROGRESS"
    ).length;
    const notStartedLessons = enrollment.lessonProgress.filter(
      (lp) => lp.status === "NOT_STARTED"
    ).length;

    // Calculate time metrics
    const totalWatchTime = enrollment.lessonProgress.reduce(
      (sum, lp) => sum + lp.watchTimeSeconds,
      0
    );
    const totalStudyTime = enrollment.lessonProgress.reduce(
      (sum, lp) => sum + lp.timeSpentMinutes,
      0
    );
    const averageTimePerLesson = completedLessons > 0 
      ? Math.round(totalStudyTime / completedLessons)
      : 0;

    // Calculate engagement score
    const engagementMetrics = enrollment.lessonProgress.reduce(
      (acc, lp) => {
        const metrics = lp.engagementMetrics as any || {};
        return {
          totalClicks: acc.totalClicks + (metrics.clicks || 0),
          totalScrolls: acc.totalScrolls + (metrics.scrolls || 0),
          totalPauses: acc.totalPauses + (metrics.pauses || 0),
          totalSeeks: acc.totalSeeks + (metrics.seeks || 0),
          totalDownloads: acc.totalDownloads + (metrics.resourceDownloads || 0),
        };
      },
      { totalClicks: 0, totalScrolls: 0, totalPauses: 0, totalSeeks: 0, totalDownloads: 0 }
    );

    // Calculate progress velocity (lessons per week)
    const weeksSinceStart = Math.max(
      1,
      Math.floor((Date.now() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7))
    );
    const progressVelocity = completedLessons / weeksSinceStart;

    // Predict completion time
    const remainingLessons = totalLessons - completedLessons;
    const estimatedWeeksToComplete = progressVelocity > 0 
      ? Math.ceil(remainingLessons / progressVelocity)
      : null;

    // Get lesson-by-lesson progress
    const lessonsProgress = enrollment.course.lessons.map((lesson) => {
      const progress = enrollment.lessonProgress.find(
        (lp) => lp.lessonId === lesson.id
      );
      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
        format: lesson.format,
        status: progress?.status || "NOT_STARTED",
        progress: progress?.videoProgress || 0,
        watchTime: progress?.watchTimeSeconds || 0,
        timeSpent: progress?.timeSpentMinutes || 0,
        completedAt: progress?.completedAt,
        lastAccessedAt: progress?.lastAccessedAt,
        score: progress?.completionScore,
      };
    });

    // Get achievements for this course
    const achievements = await prisma.studentAchievement.findMany({
      where: {
        userId: session.sub,
        achievement: {
          category: {
            in: ["COMPLETION", "STREAK", "ENGAGEMENT"]
          },
        },
      },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: "desc" },
    });

    return NextResponse.json({
      data: {
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          totalLessons,
        },
        enrollment: {
          id: enrollment.id,
          progressPercentage: enrollment.progressPercentage,
          status: enrollment.status,
          completedAt: enrollment.completedAt,
          streakDays: enrollment.streakDays,
          lastStreakDate: enrollment.lastStreakDate,
          totalStudyTime: totalStudyTime, // Use calculated value instead of database field
          createdAt: enrollment.createdAt,
          lastAccessedAt: enrollment.lastAccessedAt,
        },
        progress: {
          completedLessons,
          inProgressLessons,
          notStartedLessons,
          totalWatchTime,
          averageTimePerLesson,
          progressVelocity,
          estimatedWeeksToComplete,
        },
        engagement: {
          ...engagementMetrics,
          score: enrollment.engagementScore,
        },
        lessons: lessonsProgress,
        achievements: achievements.map((sa) => ({
          id: sa.achievement.id,
          name: sa.achievement.name,
          description: sa.achievement.description,
          icon: sa.achievement.icon,
          category: sa.achievement.category,
          points: sa.achievement.points,
          unlockedAt: sa.unlockedAt,
          progress: sa.progress,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to get course progress:", error);
    return NextResponse.json(
      { error: "Failed to get course progress" },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/courses/[courseId]/progress
 * Update overall course completion status
 */
export const PUT = rateLimitMiddleware(async (
  request: NextRequest,
  { params }: { params: { courseId: string } }
) => {
  try {
    const session = requireAuth(request);
    const { courseId } = params;
    const body = await request.json();

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.sub,
        courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: body.status,
        completedAt: body.status === "COMPLETED" ? new Date() : enrollment.completedAt,
        lastAccessedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedEnrollment,
    });
  } catch (error) {
    console.error("Failed to update course progress:", error);
    return NextResponse.json(
      { error: "Failed to update course progress" },
      { status: 500 }
    );
  }
});
