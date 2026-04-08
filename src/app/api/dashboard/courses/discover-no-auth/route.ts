import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/discover
 * Get all available courses for browsing - No auth version for testing
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("No-auth discover courses API starting...");
    
    // Return sample courses for testing
    const sampleCourses = [
      {
        id: "cmnmzgpdr0002ckeh0c9o7h5w",
        title: "Python for Data Science",
        tagline: "Learn data science with Python programming",
        level: "intermediate",
        category: "Data Science",
        coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
        progressPercentage: 0,
        lessonsCompleted: 0,
        lessonsCount: 0,
        rating: 4.8,
        reviewCount: 234,
        price: 89.99,
        format: "online",
        instructor: {
          id: "instructor-1",
          name: "Dr. Sarah Johnson",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=150&q=80"
        }
      },
      {
        id: "cmnmzgoyg0001ckehj6p6367a",
        title: "Advanced React Development",
        tagline: "Master advanced React patterns and best practices",
        level: "advanced",
        category: "Frontend Development",
        coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
        progressPercentage: 0,
        lessonsCompleted: 0,
        lessonsCount: 0,
        rating: 4.9,
        reviewCount: 189,
        price: 129.99,
        format: "online",
        instructor: {
          id: "instructor-2",
          name: "Prof. Michael Chen",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
        }
      },
      {
        id: "cmnmzgol60000ckehhovzyms7",
        title: "Web Development Basics",
        tagline: "Learn HTML, CSS, and JavaScript fundamentals",
        level: "beginner",
        category: "Web Development",
        coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
        progressPercentage: 0,
        lessonsCompleted: 0,
        lessonsCount: 0,
        rating: 4.7,
        reviewCount: 412,
        price: 0,
        format: "online",
        instructor: {
          id: "instructor-3",
          name: "Emily Rodriguez",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
        }
      }
    ];
    
    return NextResponse.json({
      data: sampleCourses,
      counts: {
        total: sampleCourses.length,
        filtered: sampleCourses.length,
      },
      debug: {
        message: "No-auth API - returning sample courses for testing",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("No-auth discover courses API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch discover courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
