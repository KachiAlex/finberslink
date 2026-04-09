import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Create sample courses and enrollments for testing
 */
export const POST = async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    
    console.log("Creating sample data for user:", session.sub);
    
    // First, let's check if there are any courses
    const existingCourses = await prisma.course.findMany({
      take: 3,
      select: { id: true, title: true }
    });
    
    if (existingCourses.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No courses found in database. Please add courses first.",
        existingCourses: []
      });
    }
    
    // Create enrollments for the user for existing courses
    const enrollments = [];
    for (const course of existingCourses) {
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
            progressPercentage: Math.floor(Math.random() * 100), // Random progress
            lastAccessedAt: new Date(),
            totalStudyTime: Math.floor(Math.random() * 1000), // Random study time
            streakDays: Math.floor(Math.random() * 10), // Random streak
          },
          include: {
            course: {
              include: {
                instructor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
                lessons: {
                  select: { id: true, title: true, order: true },
                  orderBy: { order: "asc" },
                },
              },
            },
            lessonProgress: true,
          },
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
        existingCourses: existingCourses.length,
        enrollmentsCreated: enrollments.length,
        enrollments: enrollments.map(e => ({
          courseId: e.courseId,
          courseTitle: e.course.title,
          progress: e.progressPercentage,
        }))
      },
    });
  } catch (error) {
    console.error("Failed to create sample data:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create sample data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
