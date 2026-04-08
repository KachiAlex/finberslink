import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Create enrollment without auth (for testing only)
 */
export const POST = async (request: NextRequest) => {
  try {
    console.log("Creating enrollment without auth...");
    
    // Get first available course
    const course = await prisma.course.findFirst({
      where: { publishedAt: { not: null } },
      select: { id: true, title: true, slug: true }
    });
    
    if (!course) {
      return NextResponse.json({
        success: false,
        message: "No courses found"
      });
    }
    
    // Get first user (likely the debug user)
    const user = await prisma.user.findFirst({
      where: { role: "STUDENT" },
      select: { id: true, firstName: true, lastName: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "No student user found"
      });
    }
    
    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id
        }
      }
    });
    
    if (existingEnrollment) {
      return NextResponse.json({
        success: true,
        message: "Enrollment already exists",
        data: {
          enrollmentId: existingEnrollment.id,
          courseId: course.id,
          courseTitle: course.title,
          progress: existingEnrollment.progressPercentage,
          userId: user.id,
        }
      });
    }
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: "ACTIVE",
        progressPercentage: 75,
        lastAccessedAt: new Date(),
        totalStudyTime: 300,
        streakDays: 5,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Test enrollment created successfully",
      data: {
        enrollmentId: enrollment.id,
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        progress: enrollment.progressPercentage,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
      }
    });
  } catch (error) {
    console.error("Failed to create test enrollment:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create test enrollment",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
