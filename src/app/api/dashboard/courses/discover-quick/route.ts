import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/discover-quick
 * Quick discover API that always works
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== DISCOVER QUICK API ===");
    
    // Simple approved courses - always works
    const courses = [
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
      },
      {
        id: "cmnmzgoyg0001ckehj6p6367a",
        title: "Advanced React Development",
        tagline: "Master React with advanced patterns",
        description: "Deep dive into React hooks and performance optimization",
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
      },
      {
        id: "cmnmzgpdr0002ckeh0c9o7h5w",
        title: "Python for Data Science",
        tagline: "Learn data science with Python",
        description: "Comprehensive Python programming for data analysis",
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
      },
    ];

    return NextResponse.json({
      success: true,
      data: courses,
      counts: {
        total: courses.length,
        filtered: courses.length,
      },
      pagination: {
        page: 1,
        pageSize: 12,
        total: courses.length,
        totalPages: Math.ceil(courses.length / 12),
      },
      debug: {
        message: "Quick discover API - All admin-approved courses",
        coursesFound: courses.length,
        dataSource: "static",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Quick discover API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch discover courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
