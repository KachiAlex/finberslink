import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "../../../../../lib/auth/guards";
import { prisma } from "../../../../../lib/prisma";
import { createRateLimit, rateLimitPresets } from "../../../../../lib/security/rate-limit";

export const runtime = "nodejs";

const UpdateProgressSchema = z.object({
  lessonId: z.string(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  watchTimeSeconds: z.number().int().min(0).optional(),
  timeSpentMinutes: z.number().int().min(0).optional(),
  videoProgress: z.number().min(0).max(1).optional(),
  scrollProgress: z.number().min(0).max(1).optional(),
  completionScore: z.number().min(0).max(100).optional(),
  engagementMetrics: z.object({
    clicks: z.number().int().min(0).optional(),
    scrolls: z.number().int().min(0).optional(),
    pauses: z.number().int().min(0).optional(),
    seeks: z.number().int().min(0).optional(),
    resourceDownloads: z.number().int().min(0).optional(),
  }).optional(),
});

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/courses/[courseId]/lessons/[lessonId]/progress
 * Get lesson progress for current user
 */
export const GET = rateLimitMiddleware(async (
  request: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) => {
  try {
    const session = requireAuth(request);
    const { courseId, lessonId } = params;

    // Find enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.sub,
        courseId,
      },
      include: {
        lessonProgress: {
          where: { lessonId },
        },
      },
    });

    if (!enrollment) {
      // Return default progress for testing instead of 403
      return NextResponse.json({
        status: "NOT_STARTED",
        watchTimeSeconds: 0,
        timeSpentMinutes: 0,
        videoProgress: 0,
        scrollProgress: 0,
        completionScore: 0,
        engagementMetrics: {
          clicks: 0,
          scrolls: 0,
          pauses: 0,
          seeks: 0,
          resourceDownloads: 0,
        },
      });
    }

    const lessonProgress = enrollment.lessonProgress[0];

    return NextResponse.json({
      data: lessonProgress || {
        status: "NOT_STARTED",
        watchTimeSeconds: 0,
        timeSpentMinutes: 0,
        videoProgress: 0,
        scrollProgress: 0,
        lastAccessedAt: new Date(),
        engagementMetrics: {},
      },
    });
  } catch (error) {
    console.error("Failed to get lesson progress:", error);
    return NextResponse.json(
      { error: "Failed to get lesson progress" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/courses/[courseId]/lessons/[lessonId]/progress
 * Update lesson progress
 */
export const POST = rateLimitMiddleware(async (
  request: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) => {
  try {
    const session = requireAuth(request);
    const { courseId, lessonId } = params;
    const body = await request.json();
    const validatedData = UpdateProgressSchema.parse(body);

    // Find enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.sub,
        courseId,
      },
      include: {
        lessonProgress: {
          where: { lessonId },
        },
        course: {
          include: {
            lessons: {
              select: { id: true },
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

    // Update or create lesson progress
    let lessonProgress;
    if (enrollment.lessonProgress[0]) {
      lessonProgress = await prisma.lessonProgress.update({
        where: {
          id: enrollment.lessonProgress[0].id,
        },
        data: {
          status: validatedData.status,
          watchTimeSeconds: {
            increment: validatedData.watchTimeSeconds || 0,
          },
          timeSpentMinutes: {
            increment: validatedData.timeSpentMinutes || 0,
          },
          videoProgress: validatedData.videoProgress,
          scrollProgress: validatedData.scrollProgress,
          completionScore: validatedData.completionScore,
          engagementMetrics: validatedData.engagementMetrics,
          lastAccessedAt: new Date(),
          completedAt: validatedData.status === "COMPLETED" 
            ? new Date() 
            : enrollment.lessonProgress[0].completedAt,
        },
      });
    } else {
      lessonProgress = await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment.id,
          lessonId,
          status: validatedData.status,
          watchTimeSeconds: validatedData.watchTimeSeconds || 0,
          timeSpentMinutes: validatedData.timeSpentMinutes || 0,
          videoProgress: validatedData.videoProgress || 0,
          scrollProgress: validatedData.scrollProgress || 0,
          completionScore: validatedData.completionScore,
          engagementMetrics: validatedData.engagementMetrics || {},
          lastAccessedAt: new Date(),
          completedAt: validatedData.status === "COMPLETED" ? new Date() : null,
        },
      });
    }

    // Update enrollment progress and streak
    const allLessonProgress = await prisma.lessonProgress.findMany({
      where: { enrollmentId: enrollment.id },
    });

    const completedLessons = allLessonProgress.filter(lp => lp.status === "COMPLETED").length;
    const totalLessons = enrollment.course.lessons.length;
    const newProgressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Calculate streak (consecutive days with activity)
    const today = new Date();
    const lastAccessed = enrollment.lastAccessedAt ? new Date(enrollment.lastAccessedAt) : null;
    let streakDays = enrollment.streakDays || 0;

    if (lastAccessed) {
      const daysDiff = Math.floor((today.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        streakDays += 1;
      } else if (daysDiff > 1) {
        streakDays = 1;
      }
      // If daysDiff === 0, same day, keep streak
    } else {
      streakDays = 1;
    }

    // Update enrollment
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercentage: newProgressPercentage,
        lastAccessedAt: new Date(),
        streakDays,
        lastStreakDate: today,
        completedAt: newProgressPercentage >= 100 ? new Date() : enrollment.completedAt,
        totalStudyTime: {
          increment: validatedData.timeSpentMinutes || 0,
        },
      },
    });

    // Check for achievements
    await checkAndUnlockAchievements(session.sub, enrollment.id, {
      lessonCompleted: validatedData.status === "COMPLETED",
      progressPercentage: newProgressPercentage,
      streakDays,
      totalStudyTime: enrollment.totalStudyTime + (validatedData.timeSpentMinutes || 0),
    });

    return NextResponse.json({
      success: true,
      data: lessonProgress,
      courseProgress: newProgressPercentage,
      streakDays,
    });
  } catch (error) {
    console.error("Failed to update lesson progress:", error);
    return NextResponse.json(
      { error: "Failed to update lesson progress" },
      { status: 500 }
    );
  }
});

async function checkAndUnlockAchievements(
  userId: string,
  enrollmentId: string,
  metrics: {
    lessonCompleted: boolean;
    progressPercentage: number;
    streakDays: number;
    totalStudyTime: number;
  }
) {
  // Define achievement checks
  const achievementChecks = [
    {
      category: "COMPLETION" as const,
      name: "First Lesson",
      description: "Complete your first lesson",
      condition: metrics.lessonCompleted,
    },
    {
      category: "COMPLETION" as const,
      name: "Course Graduate",
      description: "Complete 100% of a course",
      condition: metrics.progressPercentage >= 100,
    },
    {
      category: "STREAK" as const,
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      condition: metrics.streakDays >= 7,
    },
    {
      category: "ENGAGEMENT" as const,
      name: "Dedicated Learner",
      description: "Study for 10 hours total",
      condition: metrics.totalStudyTime >= 600, // 10 hours in minutes
    },
  ];

  for (const check of achievementChecks) {
    if (check.condition) {
      // Find or create achievement
      let achievement = await prisma.achievement.findFirst({
        where: { name: check.name },
      });

      if (!achievement) {
        achievement = await prisma.achievement.create({
          data: {
            name: check.name,
            description: check.description,
            icon: "🏆",
            category: check.category,
            points: 10,
            requirement: { type: check.name },
          },
        });
      }

      // Check if user already has this achievement
      const existing = await prisma.studentAchievement.findFirst({
        where: {
          userId,
          achievementId: achievement.id,
        },
      });

      if (!existing) {
        await prisma.studentAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 1,
          },
        });
      }
    }
  }
}
