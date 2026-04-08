import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/assigned-real
 * Shows courses assigned to the current student (enrollments with status: "ASSIGNED")
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== ASSIGNED COURSES API ===");
    
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

    // Get assigned enrollments for this user (status: "ASSIGNED")
    const assignedEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentUser.id,
        status: "ASSIGNED", // Only show assigned courses
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
            tagline: true,
            level: true,
            category: true,
            coverImage: true,
            publishedAt: true,
            approvalStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${assignedEnrollments.length} assigned courses`);

    // Transform to expected format
    const transformedCourses = assignedEnrollments.map((enrollment) => {
      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        tagline: enrollment.course.tagline || "",
        description: "",
        level: enrollment.course.level?.toLowerCase() || "beginner",
        category: enrollment.course.category || "General",
        coverImage: enrollment.course.coverImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
        progressPercentage: enrollment.progressPercentage || 0,
        lessonsCompleted: 0,
        lessonsCount: 12, // Mock count
        rating: 4.5 + Math.random() * 0.5, // Random rating 4.5-5.0
        reviewCount: Math.floor(Math.random() * 500) + 50, // Random reviews 50-550
        price: 0, // Assigned courses are typically free
        format: "online",
        enrollmentCount: 1, // Just this student
        instructor: {
          id: "mock-instructor",
          name: "Cynthia Eguzouwa",
          avatar: null,
        },
        createdAt: enrollment.createdAt,
        publishedAt: enrollment.course.publishedAt,
        duration: 120, // Add required duration
        enrollmentStatus: enrollment.status, // Include enrollment status
        assignedAt: enrollment.createdAt, // When it was assigned
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedCourses,
      counts: {
        total: transformedCourses.length,
        filtered: transformedCourses.length,
      },
      pagination: {
        page: 1,
        pageSize: 12,
        total: transformedCourses.length,
        totalPages: Math.ceil(transformedCourses.length / 12),
      },
      debug: {
        message: "Assigned courses API - courses assigned to student",
        userId: studentUser.id,
        userEmail: studentUser.email,
        assignedCoursesFound: assignedEnrollments.length,
        enrollmentStatus: "ASSIGNED",
        timestamp: new Date().toISOString(),
        databaseAssignments: assignedEnrollments.map(a => ({
          id: a.id,
          courseId: a.courseId,
          status: a.status,
          courseTitle: a.course.title,
        }))
      }
    });
  } catch (error) {
    console.error("Assigned courses API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch assigned courses",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
