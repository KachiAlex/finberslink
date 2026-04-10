import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const userId = session.sub;
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "12");
    
    // Filters
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "recent"; // recent, popular, rating

    // Build where clause
    const where: any = {
      approvalStatus: "APPROVED",
      archivedAt: null,
    };

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.course.count({ where });

    // Build order by
    let orderBy: any = { createdAt: "desc" };
    if (sort === "popular") {
      orderBy = { enrollments: { _count: "desc" } };
    } else if (sort === "rating") {
      // Assuming we have a rating field or calculate from certificates
      orderBy = { createdAt: "desc" };
    }

    // Fetch courses
    const courses = await prisma.course.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        title: true,
        description: true,
        tagline: true,
        level: true,
        category: true,
        coverImage: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        enrollments: {
          select: { id: true },
        },
      },
    });

    // Get enrolled course IDs for current user
    const enrolledCourseIds = await prisma.enrollment.findMany({
      where: {
        userId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: { courseId: true },
    });

    const enrolledIds = new Set(enrolledCourseIds.map((e) => e.courseId));

    // Filter out enrolled courses and format response
    const filteredCourses = courses
      .filter((course) => !enrolledIds.has(course.id))
      .map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        tagline: course.tagline,
        level: course.level,
        category: course.category,
        coverImage: course.coverImage,
        instructor: course.instructor,
        enrollmentCount: course.enrollments.length,
        isEnrolled: false,
      }));

    // Get available categories and levels for filters
    const categories = await prisma.course.findMany({
      where: { approvalStatus: "APPROVED", archivedAt: null },
      distinct: ["category"],
      select: { category: true },
    });

    const levels = await prisma.course.findMany({
      where: { approvalStatus: "APPROVED", archivedAt: null },
      distinct: ["level"],
      select: { level: true },
    });

    return NextResponse.json({
      data: filteredCourses,
      pagination: {
        skip,
        take,
        total,
        pages: Math.ceil(total / take),
      },
      filters: {
        categories: categories.map((c) => c.category),
        levels: levels.map((l) => l.level),
      },
    });
  } catch (error) {
    console.error("Error fetching discover courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
