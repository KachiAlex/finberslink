import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listLearnerCourses } from "@/features/lms/data/course-service";
import { requireAuth } from "@/lib/auth/guards";
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

/**
 * GET /api/courses
 * Get courses for the current user with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

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
          userId: session.userId,
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
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        lessons: {
          select: { id: true },
        },
        enrollments: {
          where: { userId: session.userId },
          // Enrollment model stores `progressPercentage` not `progress`
          select: { progressPercentage: true, completedAt: true },
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
          // Provide a `name` alias for UI compatibility
          name: course.title,
          // Use `any` casts where TS cannot infer joined relation properties
          instructorName: `${(course as any).instructor?.firstName || ""} ${(course as any).instructor?.lastName || ""}`.trim(),
          enrollmentCount: (course as any)._count?.enrollments || 0,
          lessonCount: (course as any)._count?.lessons || 0,
          userProgress: (course as any).enrollments?.[0]?.progressPercentage || 0,
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
}
