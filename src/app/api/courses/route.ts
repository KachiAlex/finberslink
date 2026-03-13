import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listLearnerCourses } from "@/features/lms/data/course-service";
import { requireAuth } from "@/lib/auth/guards";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ListCoursesSchema = z.object({
  skip: z.coerce.number().int().nonnegative().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(["recent", "popular", "rating"]).optional(),
});

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/courses
 * Get courses for the current user with filtering and pagination
 */
export const GET = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);

    const { searchParams } = new URL(request.url);
    const params = ListCoursesSchema.parse(Object.fromEntries(searchParams));

    const skip = params.skip || 0;
    const take = params.take || 20;
    const search = params.search?.trim();
    const sortBy = params.sortBy || "recent";

    // Build where clause for filtering
    const where: any = {
      enrollments: {
        some: {
          userId: session.sub,
        },
      },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.featured === true) {
      where.featured = true;
    }

    // Build orderBy clause
    const orderBy: any = {};
    switch (sortBy) {
      case "popular":
        orderBy._count = { enrollments: "desc" };
        break;
      case "rating":
        orderBy.avgRating = "desc";
        break;
      case "recent":
      default:
        orderBy.createdAt = "desc";
    }

    // Fetch courses with aggregates
    const courses = await prisma.course.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        instructor: {
          select: { id: true, name: true, email: true },
        },
        lessons: {
          select: { id: true },
        },
        enrollments: {
          where: { userId: session.sub },
          select: { progress: true, completedAt: true },
        },
        _count: {
          select: { enrollments: true, lessons: true },
        },
      },
    });

    const total = await prisma.course.count({ where });

    return NextResponse.json(
      {
        courses: courses.map((course) => ({
          ...course,
          enrollmentCount: course._count.enrollments,
          lessonCount: course._count.lessons,
          userProgress: course.enrollments[0]?.progress || 0,
        })),
        pagination: {
          skip,
          take,
          total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("Courses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
});
