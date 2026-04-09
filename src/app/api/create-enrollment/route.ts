import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Create a test enrollment for the current user
 */
export const POST = async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    
    console.log("Creating test enrollment for user:", session.sub);
    
    // Get first available course
    const course = await prisma.course.findFirst({
      where: { publishedAt: { not: null } },
      select: { id: true, title: true, slug: true }
    });
    
    if (!course) {
      return NextResponse.json({
        success: false,
        message: "No courses found. Please create courses first."
      });
    }
    
    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.sub,
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
        }
      });
    }
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.sub,
        courseId: course.id,
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 75, // Set some progress
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
        userId: session.sub,
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
