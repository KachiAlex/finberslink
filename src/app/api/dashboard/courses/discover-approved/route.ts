import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/discover-approved
 * Shows all courses approved by admin (approvalStatus: "APPROVED")
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== DISCOVER APPROVED COURSES API ===");
    
    // Get all approved courses (approvalStatus: "APPROVED" and published)
    const courses = await prisma.course.findMany({
      where: {
        approvalStatus: "APPROVED",
        publishedAt: { not: null },
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        tagline: true,
        description: true,
        level: true,
        category: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        instructorId: true,
        approvalStatus: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${courses.length} approved courses`);

    // Transform to expected format
    const transformedCourses = courses.map((course) => {
      return {
        id: course.id,
        title: course.title,
        tagline: course.tagline || "",
        description: course.description || "",
        level: course.level?.toLowerCase() || "beginner",
        category: course.category || "General",
        coverImage: course.coverImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
        progressPercentage: 0,
        lessonsCompleted: 0,
        lessonsCount: 12, // Mock count
        rating: 4.5 + Math.random() * 0.5, // Random rating 4.5-5.0
        reviewCount: Math.floor(Math.random() * 500) + 50, // Random reviews 50-550
        price: Math.floor(Math.random() * 200) + 50, // Random price $50-250
        format: "online",
        enrollmentCount: Math.floor(Math.random() * 1000) + 100, // Random enrollments
        instructor: {
          id: course.instructorId || "mock-instructor",
          name: "Cynthia Eguzouwa",
          avatar: null,
        },
        createdAt: course.createdAt,
        publishedAt: course.publishedAt,
        duration: 120, // Add required duration
        approvalStatus: course.approvalStatus, // Include approval status
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
        message: "Approved courses API - all admin-approved courses",
        coursesFound: courses.length,
        approvalFilter: "APPROVED",
        publishedFilter: true,
        archivedFilter: false,
        timestamp: new Date().toISOString(),
        databaseCourses: courses.map(c => ({
          id: c.id,
          title: c.title,
          level: c.level,
          category: c.category,
          approvalStatus: c.approvalStatus,
          publishedAt: c.publishedAt,
        }))
      }
    });
  } catch (error) {
    console.error("Approved courses API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch approved courses",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
