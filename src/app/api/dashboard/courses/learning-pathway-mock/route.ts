import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";

export const runtime = "nodejs";

/**
 * Mock learning-pathway API that returns sample data
 * This bypasses database issues while preserving the UI functionality
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Using mock learning-pathway API data");
    
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    // Mock data for testing the UI
    const mockCourses = [
      {
        id: "mock-course-1",
        title: "Introduction to Web Development",
        slug: "intro-web-dev",
        tagline: "Learn the fundamentals of web development",
        level: "beginner",
        instructor: {
          id: "mock-instructor-1",
          name: "John Smith",
          avatar: null,
        },
        progress: 75,
        lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        nextLesson: "CSS Fundamentals",
        timeSpent: 480, // 8 hours
        streak: 5,
        achievements: 3,
        status: "in-progress" as const,
        category: "Web Development",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        id: "mock-course-2",
        title: "Advanced JavaScript Concepts",
        slug: "advanced-js",
        tagline: "Deep dive into JavaScript advanced topics",
        level: "advanced",
        instructor: {
          id: "mock-instructor-2",
          name: "Jane Doe",
          avatar: null,
        },
        progress: 25,
        lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        nextLesson: "Closures and Scope",
        timeSpent: 120, // 2 hours
        streak: 3,
        achievements: 1,
        status: "in-progress" as const,
        category: "Programming",
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      },
      {
        id: "mock-course-3",
        title: "Database Design Fundamentals",
        slug: "db-design",
        tagline: "Learn how to design efficient databases",
        level: "intermediate",
        instructor: {
          id: "mock-instructor-3",
          name: "Bob Johnson",
          avatar: null,
        },
        progress: 100,
        lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        nextLesson: null,
        timeSpent: 600, // 10 hours
        streak: 7,
        achievements: 5,
        status: "completed" as const,
        category: "Database",
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      },
    ];

    // Apply basic filtering (for demonstration)
    let filteredCourses = mockCourses;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    if (search) {
      const searchLower = search.toLowerCase();
      filteredCourses = filteredCourses.filter((course) =>
        course.title.toLowerCase().includes(searchLower) ||
        course.instructor?.name.toLowerCase().includes(searchLower) ||
        course.tagline?.toLowerCase().includes(searchLower)
      );
    }

    if (category && category !== "all") {
      filteredCourses = filteredCourses.filter((course) =>
        course.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    return NextResponse.json({
      data: filteredCourses,
      counts: {
        total: mockCourses.length,
        filtered: filteredCourses.length,
      },
      debug: {
        mock: true,
        message: "Using mock data due to database connection issues",
        userId: session.sub,
      },
    });
  } catch (error) {
    console.error("Mock learning-pathway API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch courses",
        details: error instanceof Error ? error.message : "Unknown error",
        mock: true,
      },
      { status: 500 }
    );
  }
};
