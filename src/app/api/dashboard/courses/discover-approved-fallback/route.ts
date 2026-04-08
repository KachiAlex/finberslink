import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/discover-approved-fallback
 * Shows approved courses with database fallback to mock data
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== DISCOVER APPROVED FALLBACK API ===");
    
    // Try to get real data first
    try {
      const { prisma } = await import("@/lib/prisma");
      
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

      console.log(`Found ${courses.length} approved courses from database`);

      // Transform real data
      const transformedCourses = courses.map((course) => ({
        id: course.id,
        title: course.title,
        tagline: course.tagline || "",
        description: course.description || "",
        level: course.level?.toLowerCase() || "beginner",
        category: course.category || "General",
        coverImage: course.coverImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
        progressPercentage: 0,
        lessonsCompleted: 0,
        lessonsCount: 12,
        rating: 4.5 + Math.random() * 0.5,
        reviewCount: Math.floor(Math.random() * 500) + 50,
        price: Math.floor(Math.random() * 200) + 50,
        format: "online",
        enrollmentCount: Math.floor(Math.random() * 1000) + 100,
        instructor: {
          id: course.instructorId || "mock-instructor",
          name: "Cynthia Eguzouwa",
          avatar: null,
        },
        createdAt: course.createdAt,
        publishedAt: course.publishedAt,
        duration: 120,
        approvalStatus: course.approvalStatus,
      }));

      return NextResponse.json({
        success: true,
        data: transformedCourses,
        counts: { total: transformedCourses.length, filtered: transformedCourses.length },
        debug: {
          message: "Real approved courses from database",
          coursesFound: courses.length,
          dataSource: "database",
        }
      });

    } catch (dbError) {
      console.log("Database failed, using mock data:", dbError.message);
      
      // Fallback to mock approved courses
      const mockCourses = [
        {
          id: "cmnmzgol60000ckehhovzyms7",
          title: "Web Development Basics",
          tagline: "Learn the fundamentals of web development",
          description: "Start your journey with HTML, CSS, and JavaScript",
          level: "beginner" as const,
          category: "Web Development",
          coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
          progressPercentage: 0,
          lessonsCompleted: 0,
          lessonsCount: 12,
          rating: 4.8,
          reviewCount: 156,
          price: 0,
          format: "online",
          enrollmentCount: 2341,
          instructor: {
            id: "cmmvuk71s00026ysyexzahfop",
            name: "Cynthia Eguzouwa",
            avatar: null,
          },
          createdAt: new Date(),
          publishedAt: new Date(),
          duration: 120,
          approvalStatus: "APPROVED",
        },
        {
          id: "cmnmzgoyg0001ckehj6p6367a",
          title: "Advanced React Development",
          tagline: "Master React with advanced patterns and best practices",
          description: "Deep dive into React hooks, context, and performance optimization",
          level: "advanced" as const,
          category: "Frontend Development",
          coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
          progressPercentage: 0,
          lessonsCompleted: 0,
          lessonsCount: 18,
          rating: 4.9,
          reviewCount: 203,
          price: 89,
          format: "online",
          enrollmentCount: 1456,
          instructor: {
            id: "cmmvuk71s00026ysyexzahfop",
            name: "Cynthia Eguzouwa",
            avatar: null,
          },
          createdAt: new Date(),
          publishedAt: new Date(),
          duration: 120,
          approvalStatus: "APPROVED",
        },
        {
          id: "cmnmzgpdr0002ckeh0c9o7h5w",
          title: "Python for Data Science",
          tagline: "Learn data science with Python programming",
          description: "Comprehensive course covering Python programming with focus on data analysis and machine learning",
          level: "intermediate" as const,
          category: "Data Science",
          coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
          progressPercentage: 0,
          lessonsCompleted: 0,
          lessonsCount: 24,
          rating: 4.7,
          reviewCount: 289,
          price: 129,
          format: "online",
          enrollmentCount: 3621,
          instructor: {
            id: "cmmvuk71s00026ysyexzahfop",
            name: "Cynthia Eguzouwa",
            avatar: null,
          },
          createdAt: new Date(),
          publishedAt: new Date(),
          duration: 120,
          approvalStatus: "APPROVED",
        },
      ];

      return NextResponse.json({
        success: true,
        data: mockCourses,
        counts: { total: mockCourses.length, filtered: mockCourses.length },
        debug: {
          message: "Mock approved courses (database unavailable)",
          coursesFound: mockCourses.length,
          dataSource: "mock",
          databaseError: dbError.message,
        }
      });
    }
  } catch (error) {
    console.error("Approved courses fallback API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch approved courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
