import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";

export const runtime = "nodejs";

/**
 * Mock discover courses API that returns sample data
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Using mock discover courses API data");
    
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const mockCourses = [
      {
        id: "mock-discover-1",
        title: "React Development Masterclass",
        slug: "react-masterclass",
        tagline: "Build modern web applications with React",
        level: "intermediate",
        instructor: {
          id: "mock-instructor-6",
          name: "Sarah Johnson",
          avatar: null,
        },
        description: "Learn React from scratch and build amazing applications",
        rating: 4.8,
        reviewCount: 234,
        duration: "12 weeks",
        format: "online",
        price: 99.99,
        enrolledCount: 1520,
        certificateAvailable: true,
        prerequisites: ["Basic JavaScript", "HTML/CSS"],
        outcomes: ["React Components", "State Management", "React Hooks"],
        coverImage: null,
        category: "Frontend Development",
        publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        id: "mock-discover-2",
        title: "Python for Data Science",
        slug: "python-data-science",
        tagline: "Complete Python guide for data analysis",
        level: "beginner",
        instructor: {
          id: "mock-instructor-7",
          name: "Michael Brown",
          avatar: null,
        },
        description: "Learn Python programming with focus on data science applications",
        rating: 4.9,
        reviewCount: 456,
        duration: "10 weeks",
        format: "online",
        price: 79.99,
        enrolledCount: 2100,
        certificateAvailable: true,
        prerequisites: ["Basic programming concepts"],
        outcomes: ["Python Basics", "Data Analysis", "Visualization"],
        coverImage: null,
        category: "Data Science",
        publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        id: "mock-discover-3",
        title: "Cloud Architecture with AWS",
        slug: "aws-cloud-architecture",
        tagline: "Design and deploy cloud solutions",
        level: "advanced",
        instructor: {
          id: "mock-instructor-8",
          name: "David Martinez",
          avatar: null,
        },
        description: "Master AWS cloud architecture and best practices",
        rating: 4.7,
        reviewCount: 189,
        duration: "8 weeks",
        format: "hybrid",
        price: 149.99,
        enrolledCount: 890,
        certificateAvailable: true,
        prerequisites: ["Basic cloud concepts", "Linux fundamentals"],
        outcomes: ["AWS Services", "Cloud Design", "Security Best Practices"],
        coverImage: null,
        category: "Cloud Computing",
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: "mock-discover-4",
        title: "UX/UI Design Fundamentals",
        slug: "ux-ui-fundamentals",
        tagline: "Create beautiful and functional user interfaces",
        level: "beginner",
        instructor: {
          id: "mock-instructor-9",
          name: "Emily Davis",
          avatar: null,
        },
        description: "Learn the principles of user experience and interface design",
        rating: 4.6,
        reviewCount: 312,
        duration: "6 weeks",
        format: "online",
        price: 59.99,
        enrolledCount: 1800,
        certificateAvailable: true,
        prerequisites: ["None"],
        outcomes: ["Design Principles", "User Research", "Prototyping"],
        coverImage: null,
        category: "Design",
        publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ];

    // Apply filtering
    let filteredCourses = mockCourses;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const level = searchParams.get("level") || "";
    const format = searchParams.get("format") || "";

    if (search) {
      const searchLower = search.toLowerCase();
      filteredCourses = filteredCourses.filter((course) =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower) ||
        course.instructor?.name.toLowerCase().includes(searchLower)
      );
    }

    if (category && category !== "all") {
      filteredCourses = filteredCourses.filter((course) =>
        course.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (level && level !== "all") {
      filteredCourses = filteredCourses.filter((course) =>
        course.level?.toLowerCase() === level.toLowerCase()
      );
    }

    if (format && format !== "all") {
      filteredCourses = filteredCourses.filter((course) =>
        course.format?.toLowerCase() === format.toLowerCase()
      );
    }

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;
    
    const paginatedCourses = filteredCourses.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedCourses,
      counts: {
        total: mockCourses.length,
        filtered: filteredCourses.length,
      },
      pagination: {
        page,
        pageSize: limit,
        total: filteredCourses.length,
        totalPages: Math.ceil(filteredCourses.length / limit),
      },
      debug: {
        mock: true,
        message: "Using mock data due to database connection issues",
        userId: session.sub,
      },
    });
  } catch (error) {
    console.error("Mock discover courses API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch discover courses",
        details: error instanceof Error ? error.message : "Unknown error",
        mock: true,
      },
      { status: 500 }
    );
  }
};
