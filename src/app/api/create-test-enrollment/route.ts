import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Create a simple test enrollment
 */
export const POST = async (request: NextRequest) => {
  try {
    const session = await requireAuth(request);
    
    // Get first available course
    const course = await prisma.course.findFirst({
      where: { publishedAt: { not: null } },
      select: { id: true, title: true }
    });
    
    if (!course) {
      return NextResponse.json({
        success: false,
        message: "No courses found"
      });
    }
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.userId,
        courseId: course.id,
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 50,
        lastAccessedAt: new Date(),
        totalStudyTime: 300,
        streakDays: 5,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Test enrollment created",
      data: {
        enrollmentId: enrollment.id,
        courseId: course.id,
        courseTitle: course.title,
        userId: session.sub,
        progress: enrollment.progressPercentage,
      }
    });
  } catch (error) {
    console.error("Failed to create test enrollment:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create test enrollment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
