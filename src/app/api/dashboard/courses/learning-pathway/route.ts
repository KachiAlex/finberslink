import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/dashboard/courses/learning-pathway
 * Get student's enrolled courses with progress details
 */
export const GET = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    let session;
    try {
      session = requireAuth(request);
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized", details: "Authentication failed" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Get user's enrollments with course data
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
    });

    console.log("Found enrollments:", enrollments.length);

    // Get user achievements separately - temporarily disabled for testing
    // const userAchievements = await prisma.studentAchievement.findMany({
    //   where: {
    //     userId: session.sub,
    //   },
    //   include: {
    //     achievement: true,
    //   },
    // });
    const userAchievements = []; // Temporarily empty

    // Transform to LearningPathwayCourse format
    const courses = enrollments.map((enrollment) => {
      try {
        const progress = enrollment.progressPercentage || 0;
        const completedLessons = enrollment.lessonProgress?.filter(
          (lp) => lp.status === "COMPLETED"
        ).length || 0;
        const nextLesson = enrollment.course.lessons.find(
          (lesson) =>
            !enrollment.lessonProgress?.some((lp) => lp.lessonId === lesson.id && lp.status === "COMPLETED")
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
          lastAccessed: enrollment.lastAccessedAt || null,
          nextLesson: nextLesson?.title,
          timeSpent: 0, // Default to 0 since field doesn't exist
          streak: 0, // Default to 0 since field doesn't exist
          achievements: userAchievements.length, // Use total user achievements instead of course-specific
          status,
          category: enrollment.course.category,
          createdAt: enrollment.createdAt,
        };
      } catch (error) {
        console.error("Error transforming enrollment:", error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries

    console.log("Transformed courses:", courses.length);

    const filters = {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      progress: searchParams.get("progress") || "all",
      status: searchParams.get("status") || "active",
      dateRange: searchParams.get("dateRange") || "recent",
    };

    // Apply filters
    let filteredCourses = courses;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredCourses = filteredCourses.filter((course) =>
        course.title.toLowerCase().includes(searchLower) ||
        course.instructor?.name.toLowerCase().includes(searchLower) ||
        course.tagline?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filteredCourses = filteredCourses.filter((course) =>
        course.category?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.progress !== "all") {
      filteredCourses = filteredCourses.filter((course) => {
        switch (filters.progress) {
          case "in-progress":
            return course.status === "in-progress";
          case "completed":
            return course.status === "completed";
          case "not-started":
            return course.status === "not-started";
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filteredCourses.sort((a, b) => {
      switch (filters.dateRange) {
        case "recent":
          return (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0);
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        default:
          return 0;
      }
    });

    return NextResponse.json({
      data: filteredCourses,
      counts: {
        total: courses.length,
        filtered: filteredCourses.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch learning pathway courses:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { 
        error: "Failed to fetch courses",
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});
