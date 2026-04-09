import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

/**
 * POST /api/enrollments-working
 * Working enrollment API based on database test results
 */
export const POST = async (request: NextRequest) => {
  try {
    console.log("=== WORKING ENROLLMENT API ===");
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Get the first student user (your account) for testing
    const studentUser = await prisma.user.findFirst({
      where: { 
        email: "onyedika.akoma@gmail.com",
        role: "STUDENT"
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true 
      },
    });

    if (!studentUser) {
      return NextResponse.json(
        { success: false, error: "Student user not found" },
        { status: 404 }
      );
    }

    console.log("Using student user:", studentUser.email);

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
        level: true,
        category: true,
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
          userId: studentUser.id,
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
        userId: studentUser.id,
        courseId: courseId,
        status: EnrollmentStatus.ACTIVE,
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
        level: course.level,
        category: course.category,
      },
      user: {
        id: studentUser.id,
        name: `${studentUser.firstName} ${studentUser.lastName}`,
        email: studentUser.email,
      },
      debug: {
        message: "Enrollment created successfully",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Working enrollment API error:", error);
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
 * GET /api/enrollments-working
 * Get user's enrollments - Working version
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== GET ENROLLMENTS API ===");
    
    // Get your user account
    const studentUser = await prisma.user.findFirst({
      where: { 
        email: "onyedika.akoma@gmail.com",
        role: "STUDENT"
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true 
      },
    });

    if (!studentUser) {
      return NextResponse.json(
        { success: false, error: "Student user not found" },
        { status: 404 }
      );
    }

    // Get enrollments for this user (only select existing fields)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentUser.id,
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        progressPercentage: true,
        lastAccessedAt: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            tagline: true,
            level: true,
            category: true,
            coverImage: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: enrollments,
      count: enrollments.length,
      user: {
        id: studentUser.id,
        name: `${studentUser.firstName} ${studentUser.lastName}`,
        email: studentUser.email,
      },
      debug: {
        message: "Enrollments retrieved successfully",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Get enrollments API error:", error);
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
