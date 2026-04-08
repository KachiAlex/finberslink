import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/enrollments-no-auth
 * Enroll a student in a course - No auth version for testing
 */
export const POST = async (request: NextRequest) => {
  try {
    console.log("Enrollment API (no-auth) starting...");
    const body = await request.json();
    const { courseId, userId } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    // For testing, use the provided userId or get the first student user
    let targetUserId = userId;
    if (!targetUserId) {
      const studentUser = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      targetUserId = studentUser?.id;
      console.log("Using student user:", studentUser);
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "No student user found for testing" },
        { status: 404 }
      );
    }

    // Check if course exists and is published
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        publishedAt: { not: null },
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found or not available" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: targetUserId,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({
        success: false,
        error: "Already enrolled in this course",
        enrollment: existingEnrollment,
      });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: targetUserId,
        courseId: courseId,
        status: "ACTIVE",
        progressPercentage: 0,
        lastAccessedAt: new Date(),
      },
    });

    console.log("Created enrollment:", enrollment.id);

    return NextResponse.json({
      success: true,
      message: "Successfully enrolled in course",
      enrollment: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        userId: enrollment.userId,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        createdAt: enrollment.createdAt,
      },
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
      debug: {
        message: "Enrollment created (no-auth version)",
        targetUserId: targetUserId,
      }
    });
  } catch (error) {
    console.error("Enrollment API (no-auth) error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to enroll in course",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};

/**
 * GET /api/enrollments-no-auth
 * Get user's enrollments - No auth version for testing
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Get enrollments API (no-auth) starting...");
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    // For testing, get the first student user's enrollments
    const studentUser = await prisma.user.findFirst({
      where: { role: "STUDENT" },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!studentUser) {
      return NextResponse.json(
        { success: false, error: "No student user found for testing" },
        { status: 404 }
      );
    }

    let where: any = { userId: studentUser.id };
    
    if (courseId) {
      where.courseId = courseId;
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            tagline: true,
            level: true,
            category: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: enrollments,
      count: enrollments.length,
      debug: {
        message: "Enrollments fetched (no-auth version)",
        targetUserId: studentUser.id,
        targetUserEmail: studentUser.email,
      }
    });
  } catch (error) {
    console.error("Get enrollments API (no-auth) error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch enrollments",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
