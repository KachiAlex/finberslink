import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

/**
 * POST /api/enrollments
 * Enroll a student in a course
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Check if course exists and is available
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          select: { id: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: "Course is not available for enrollment" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.userId,
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
        userId: session.userId,
        courseId: courseId,
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 0,
        lastAccessedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully enrolled in course",
      enrollment: {
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        createdAt: enrollment.createdAt,
      },
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to enroll in course",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrollments
 * Get user's enrollments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    let where: any = { userId: session.userId };
    
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
            thumbnail: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: enrollments.map(enrollment => ({
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        createdAt: enrollment.createdAt,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          slug: enrollment.course.slug,
          thumbnail: enrollment.course.thumbnail,
          instructor: enrollment.course.instructor,
        },
      })),
    });
  } catch (error) {
    console.error("Get enrollments API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch enrollments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
