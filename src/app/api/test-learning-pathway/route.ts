import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "../../../lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Simplified test version of learning-pathway API
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Starting simplified learning-pathway test API");
    
    const session = requireAuth(request);
    console.log("Session authenticated for user:", session.sub);
    
    // Test basic enrollment query first
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.sub,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            lessons: {
              select: { id: true, title: true, order: true },
              orderBy: { order: "asc" },
            },
          },
        },
        lessonProgress: {
          include: {
            lesson: {
              select: { id: true, title: true, order: true },
            },
          },
        },
      },
      take: 3, // Limit for testing
    });
    
    console.log("Found enrollments:", enrollments.length);

    // Get user achievements separately
    const userAchievements = await prisma.studentAchievement.findMany({
      where: {
        userId: session.sub,
      },
      include: {
        achievement: true,
      },
    });
    
    console.log("Found user achievements:", userAchievements.length);

    // Transform to LearningPathwayCourse format
    const courses = enrollments.map((enrollment) => {
      const progress = enrollment.progressPercentage;
      const completedLessons = enrollment.lessonProgress.filter(
        (lp) => lp.status === "COMPLETED"
      ).length;
      const nextLesson = enrollment.course.lessons.find(
        (lesson) =>
          !enrollment.lessonProgress.some((lp) => lp.lessonId === lesson.id && lp.status === "COMPLETED")
      );

      // Determine status
      let status: "in-progress" | "completed" | "not-started";
      if (progress >= 100) status = "completed";
      else if (progress > 0) status = "in-progress";
      else status = "not-started";

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        tagline: enrollment.course.tagline,
        level: enrollment.course.level,
        instructor: enrollment.course.instructor
          ? {
              id: enrollment.course.instructor.id,
              name: `${enrollment.course.instructor.firstName} ${enrollment.course.instructor.lastName}`,
              avatar: enrollment.course.instructor.avatarUrl,
            }
          : undefined,
        progress,
        lastAccessed: enrollment.lastAccessedAt,
        nextLesson: nextLesson?.title,
        timeSpent: enrollment.totalStudyTime,
        streak: enrollment.streakDays,
        achievements: userAchievements.length,
        status,
        category: enrollment.course.category,
        createdAt: enrollment.createdAt,
      };
    });

    console.log("Transformed courses:", courses.length);

    return NextResponse.json({
      success: true,
      data: courses,
      counts: {
        total: courses.length,
        filtered: courses.length,
      },
      debug: {
        enrollmentCount: enrollments.length,
        achievementCount: userAchievements.length,
      },
    });
  } catch (error) {
    console.error("Simplified learning-pathway API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch courses",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
