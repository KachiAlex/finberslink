import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Create sample enrollments for current user
 */
export const POST = async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    
    console.log("Creating sample enrollments for user:", session.sub);
    
    // Get available courses
    const courses = await prisma.course.findMany({
      where: { publishedAt: { not: null } },
      select: { id: true, title: true, slug: true }
    });
    
    if (courses.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No courses found. Please create courses first."
      });
    }
    
    // Create enrollments for the user
    const enrollments = [];
    for (const course of courses) {
      // Check if enrollment already exists
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.sub,
            courseId: course.id
          }
        }
      });
      
      if (!existingEnrollment) {
        const enrollment = await prisma.enrollment.create({
          data: {
            userId: session.sub,
            courseId: course.id,
            status: EnrollmentStatus.ACTIVE,
            progressPercentage: Math.floor(Math.random() * 100), // Random progress 0-100
            lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random last access within 7 days
            totalStudyTime: Math.floor(Math.random() * 1000), // Random study time in minutes
            streakDays: Math.floor(Math.random() * 10), // Random streak 0-10 days
          }
        });
        enrollments.push(enrollment);
      } else {
        enrollments.push(existingEnrollment);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Sample enrollments created successfully",
      data: {
        userId: session.sub,
        coursesAvailable: courses.length,
        enrollmentsCreated: enrollments.length,
        enrollments: enrollments.map(e => ({
          courseId: e.courseId,
          progress: e.progressPercentage,
          status: e.status,
          lastAccessed: e.lastAccessedAt,
        }))
      },
    });
  } catch (error) {
    console.error("Failed to create sample enrollments:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create sample enrollments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
