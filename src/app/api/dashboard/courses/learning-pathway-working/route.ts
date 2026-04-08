import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/learning-pathway-working
 * Working learning pathway API to show enrolled courses
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== WORKING LEARNING PATHWAY API ===");
    
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

    console.log("Found student user:", studentUser.email);

    // Get enrollments for this user (only select existing fields)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentUser.id,
        status: "ACTIVE", // Only show active enrollments
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
            instructorId: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${enrollments.length} active enrollments`);

    // Transform to LearningPathwayCourse format
    const courses = enrollments.map((enrollment) => {
      const progress = enrollment.progressPercentage || 0;
      
      // Determine status based on progress
      let status: "in-progress" | "completed" | "not-started";
      if (progress >= 100) status = "completed";
      else if (progress > 0) status = "in-progress";
      else status = "not-started";

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug || `course-${enrollment.course.id}`,
        tagline: enrollment.course.tagline || "",
        level: enrollment.course.level?.toLowerCase() || "beginner",
        instructor: enrollment.course.instructor
          ? {
              id: enrollment.course.instructor.id,
              name: `${enrollment.course.instructor.firstName} ${enrollment.course.instructor.lastName}`,
              avatar: enrollment.course.instructor.avatarUrl,
            }
          : undefined,
        progress,
        lastAccessed: enrollment.lastAccessedAt || null,
        nextLesson: progress < 100 ? "Continue with next lesson" : "Course completed",
        timeSpent: 0, // Default value
        streak: 0, // Default value
        achievements: 0, // Default value
        status,
        category: enrollment.course.category || "General",
        createdAt: enrollment.createdAt,
      };
    });

    return NextResponse.json({
      data: courses,
      counts: {
        total: courses.length,
        filtered: courses.length,
      },
      debug: {
        userId: studentUser.id,
        userEmail: studentUser.email,
        enrollmentsFound: enrollments.length,
        coursesReturned: courses.length,
        message: "Working learning pathway API - enrolled courses",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Working learning pathway API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch learning pathway courses",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
