import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/dashboard/courses/discover
 * Get discoverable courses for enrollment
 */
export const GET = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      level: searchParams.get("level") || "",
      format: searchParams.get("format") || "",
      price: searchParams.get("price") || "all",
      rating: searchParams.get("rating") || "0",
    };

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Get user's current enrollments to exclude them
    const userEnrollments = await prisma.enrollment.findMany({
      where: { userId: session.sub },
      select: { courseId: true },
    });
    const enrolledCourseIds = userEnrollments.map(e => e.courseId);

    // Build where clause
    const where: any = {
      publishedAt: { not: null },
      approvalStatus: "APPROVED",
      archivedAt: null,
      id: { not: { in: enrolledCourseIds } },
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { tagline: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.category) {
      where.category = { contains: filters.category, mode: "insensitive" };
    }

    if (filters.level) {
      where.level = filters.level.toUpperCase();
    }

    if (filters.format) {
      // This would need to be implemented based on course format data
      // For now, we'll skip this filter
    }

    // Get courses with additional data
    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          enrollments: {
            select: { id: true },
          },
          lessons: {
            select: { id: true, durationMinutes: true },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: [
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    // Transform to DiscoverableCourse format
    const discoverableCourses = courses.map((course) => {
      const totalDuration = course.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
      const averageRating = 4.5; // Would come from reviews table
      const reviewCount = Math.floor(Math.random() * 100) + 10; // Would come from reviews table

      // Determine course level
      let level: "beginner" | "intermediate" | "advanced" = "beginner";
      if (course.level?.includes("INTERMEDIATE")) level = "intermediate";
      else if (course.level?.includes("ADVANCED")) level = "advanced";

      // Determine format based on lessons
      const hasVideoLessons = course.lessons.some(lesson => lesson.durationMinutes > 0);
      const format = hasVideoLessons ? "Video" : "Text";

      // Generate mock outcomes
      const outcomes = course.outcomes.slice(0, 3);

      // Generate mock prerequisites for advanced courses
      const prerequisites = level === "advanced" 
        ? ["Basic programming knowledge", "Understanding of web development"]
        : level === "intermediate"
        ? ["Basic programming knowledge"]
        : [];

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        tagline: course.tagline,
        level,
        instructor: course.instructor
          ? {
              id: course.instructor.id,
              name: `${course.instructor.firstName} ${course.instructor.lastName}`,
              avatar: course.instructor.avatarUrl,
            }
          : undefined,
        duration: totalDuration,
        format,
        rating: averageRating,
        reviewCount,
        enrollmentCount: course._count.enrollments,
        prerequisites,
        outcomes,
        coverImage: course.coverImage,
        price: 0, // Free courses for now
        certificateAvailable: course.certificateAvailable,
        category: course.category,
        publishedAt: course.publishedAt,
      };
    });

    // Apply additional filters
    let filteredCourses = discoverableCourses;

    if (filters.rating && parseFloat(filters.rating) > 0) {
      filteredCourses = filteredCourses.filter(
        (course) => course.rating >= parseFloat(filters.rating)
      );
    }

    if (filters.price !== "all") {
      // For now, all courses are free
      if (filters.price === "paid") {
        filteredCourses = [];
      }
    }

    // Sort by rating and enrollment count
    filteredCourses.sort((a, b) => {
      if (a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      return b.enrollmentCount - a.enrollmentCount;
    });

    return NextResponse.json({
      data: filteredCourses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + filteredCourses.length < totalCount,
      },
      counts: {
        total: discoverableCourses.length,
        filtered: filteredCourses.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch discoverable courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch discoverable courses" },
      { status: 500 }
    );
  }
});
