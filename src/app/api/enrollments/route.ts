import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * POST /api/enrollments
 * Enroll a student in a course
 */
export const POST = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
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
          userId: session.sub,
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
        userId: session.sub,
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
    });
  } catch (error) {
    console.error("Enrollment API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to enroll in course",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/enrollments
 * Get user's enrollments
 */
export const GET = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    let where: any = { userId: session.sub };
    
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
});
