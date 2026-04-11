import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/debug/all-courses
 * Get ALL courses in the tenant for debugging
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== DEBUG: Getting ALL courses in tenant ===");
    
    // Get all courses without any filters
    const allCourses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${allCourses.length} total courses`);

    // Get all users for context
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: { role: "asc" },
    });

    // Get all enrollments for context
    const allEnrollments = await prisma.enrollment.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      message: "All courses data retrieved successfully",
      data: {
        courses: allCourses.map(course => ({
          id: course.id,
          title: course.title,
          tagline: course.tagline,
          description: course.description ? course.description.substring(0, 100) + "..." : null,
          level: course.level,
          category: course.category,
          isFree: course.isFree,
          publishedAt: course.publishedAt,
          archivedAt: course.archivedAt,
          instructor: course.instructor ? {
            name: `${course.instructor.firstName} ${course.instructor.lastName}`,
            email: course.instructor.email,
            role: course.instructor.role,
          } : null,
          stats: {
            enrollmentsCount: course._count.enrollments,
            lessonsCount: course._count.lessons,
          },
          createdAt: course.createdAt,
        })),
        users: allUsers,
        enrollments: allEnrollments.map(enrollment => ({
          id: enrollment.id,
          user: {
            name: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
            email: enrollment.user.email,
          },
          course: {
            title: enrollment.course.title,
          },
          status: enrollment.status,
          progressPercentage: enrollment.progressPercentage,
          createdAt: enrollment.createdAt,
        })),
      },
      summary: {
        totalCourses: allCourses.length,
        publishedCourses: allCourses.filter(c => c.publishedAt).length,
        draftCourses: allCourses.filter(c => !c.publishedAt).length,
        totalUsers: allUsers.length,
        students: allUsers.filter(u => u.role === "STUDENT").length,
        instructors: allUsers.filter(u => u.role === "INSTRUCTOR").length,
        totalEnrollments: allEnrollments.length,
      },
      debug: {
        timestamp: new Date().toISOString(),
        message: "Complete tenant course overview",
      }
    });
  } catch (error) {
    console.error("=== DEBUG: Error getting all courses ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to retrieve all courses",
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
