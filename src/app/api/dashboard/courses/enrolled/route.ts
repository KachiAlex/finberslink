import { NextRequest, NextResponse } from "next/server";
import { EnrollmentStatus, LessonProgressStatus } from "@prisma/client";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const userId = session.sub;
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "12");
    const sort = searchParams.get("sort") || "recent"; // recent, progress, completion

    // Get total count for pagination
    const total = await prisma.enrollment.count({
      where: {
        userId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    // Build order by
    let orderBy: any = { createdAt: "desc" };
    if (sort === "progress") {
      orderBy = { progressPercentage: "desc" };
    } else if (sort === "completion") {
      orderBy = { completedAt: "desc" };
    }

    // Fetch enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: EnrollmentStatus.ACTIVE,
      },
      skip,
      take,
      orderBy,
      select: {
        id: true,
        progressPercentage: true,
        createdAt: true,
        completedAt: true,
        course: {
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
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    // Get lesson progress for each course
    const enrollmentIds = enrollments.map((e) => e.id);
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
        status: LessonProgressStatus.COMPLETED,
      },
      select: {
        enrollmentId: true,
        id: true,
      },
    });

    const progressByEnrollment = new Map<string, number>();
    lessonProgress.forEach((lp) => {
      progressByEnrollment.set(
        lp.enrollmentId,
        (progressByEnrollment.get(lp.enrollmentId) || 0) + 1
      );
    });

    // Format response
    const formattedEnrollments = enrollments.map((enrollment) => {
      const lessonsCompleted = progressByEnrollment.get(enrollment.id) || 0;
      const lessonsCount = enrollment.course.lessons.length;

      return {
        enrollmentId: enrollment.id,
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        tagline: enrollment.course.tagline,
        level: enrollment.course.level,
        category: enrollment.course.category,
        coverImage: enrollment.course.coverImage,
        instructor: enrollment.course.instructor,
        progressPercentage: enrollment.progressPercentage,
        enrolledAt: enrollment.createdAt,
        completedAt: enrollment.completedAt,
        lessonsCount,
        lessonsCompleted,
        nextLessonId: undefined, // Can be populated if needed
      };
    });

    return NextResponse.json({
      data: formattedEnrollments,
      pagination: {
        skip,
        take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching enrolled courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrolled courses" },
      { status: 500 }
    );
  }
}
