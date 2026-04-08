import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";

export const runtime = "nodejs";

/**
 * Mock assigned courses API that returns sample data
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Using mock assigned courses API data");
    
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const mockCourses = [
      {
        id: "mock-assigned-1",
        title: "Data Science Bootcamp",
        slug: "data-science-bootcamp",
        tagline: "Comprehensive data science program",
        level: "intermediate",
        instructor: {
          id: "mock-instructor-4",
          name: "Alice Wilson",
          avatar: null,
        },
        cohort: {
          id: "cohort-1",
          name: "Data Science Fall 2024",
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
          instructor: {
            id: "mock-instructor-4",
            name: "Alice Wilson",
            avatar: null,
            email: "alice@example.com",
          },
          classmates: [
            { id: "classmate-1", name: "Student A", avatar: null },
            { id: "classmate-2", name: "Student B", avatar: null },
            { id: "classmate-3", name: "Student C", avatar: null },
          ],
          deadlines: [
            { id: "deadline-1", title: "Project 1 Submission", date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), type: "assignment" as const },
            { id: "deadline-2", title: "Midterm Exam", date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), type: "exam" as const },
          ],
        },
        progress: 60,
        priority: "medium" as const,
        category: "Data Science",
        assignedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        assignedBy: "Admin User",
      },
      {
        id: "mock-assigned-2",
        title: "Machine Learning Fundamentals",
        slug: "ml-fundamentals",
        tagline: "Introduction to machine learning concepts",
        level: "advanced",
        instructor: {
          id: "mock-instructor-5",
          name: "Dr. Robert Chen",
          avatar: null,
        },
        cohort: {
          id: "cohort-2",
          name: "ML Advanced 2024",
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
          instructor: {
            id: "mock-instructor-5",
            name: "Dr. Robert Chen",
            avatar: null,
            email: "robert@example.com",
          },
          classmates: [
            { id: "classmate-4", name: "Student D", avatar: null },
            { id: "classmate-5", name: "Student E", avatar: null },
          ],
          deadlines: [
            { id: "deadline-3", title: "Algorithm Implementation", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), type: "project" as const },
          ],
        },
        progress: 30,
        priority: "high" as const,
        category: "Machine Learning",
        assignedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        assignedBy: "System",
      },
    ];

    // Apply basic filtering
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
    console.error("Mock assigned courses API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch assigned courses",
        details: error instanceof Error ? error.message : "Unknown error",
        mock: true,
      },
      { status: 500 }
    );
  }
};
