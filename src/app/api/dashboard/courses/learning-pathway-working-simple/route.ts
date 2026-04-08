import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Mock data function for when no real data is available
function getMockLearningPathwayCourses() {
  return [
    {
      id: "course-1",
      title: "Introduction to Web Development",
      slug: "intro-web-dev",
      tagline: "Learn fundamentals of web development",
      level: "beginner",
      instructor: {
        id: "instructor-1",
        name: "John Smith",
        avatar: "https://picsum.photos/seed/instructor1/100/100.jpg",
      },
      progress: 75,
      lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      nextLesson: "CSS Grid and Flexbox",
      timeSpent: 1200, // 20 hours
      streak: 5,
      achievements: 3,
      status: "in-progress" as const,
      category: "Web Development",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
    {
      id: "course-2",
      title: "Advanced JavaScript",
      slug: "advanced-js",
      tagline: "Master advanced JavaScript concepts",
      level: "advanced",
      instructor: {
        id: "instructor-2",
        name: "Jane Doe",
        avatar: "https://picsum.photos/seed/instructor2/100/100.jpg",
      },
      progress: 45,
      lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      nextLesson: "Async Programming Patterns",
      timeSpent: 800, // ~13 hours
      streak: 3,
      achievements: 2,
      status: "in-progress" as const,
      category: "Programming",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    },
    {
      id: "course-3",
      title: "React Fundamentals",
      slug: "react-fundamentals",
      tagline: "Build modern web apps with React",
      level: "intermediate",
      instructor: {
        id: "instructor-3",
        name: "Mike Johnson",
        avatar: "https://picsum.photos/seed/instructor3/100/100.jpg",
      },
      progress: 100,
      lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      nextLesson: "Course completed!",
      timeSpent: 1600, // ~27 hours
      streak: 7,
      achievements: 5,
      status: "completed" as const,
      category: "Frontend",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    }
  ];
}

/**
 * GET /api/dashboard/courses/learning-pathway-working-simple
 * Simple learning pathway API that returns mock data
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== SIMPLE LEARNING PATHWAY API ===");
    
    // Return mock data directly - no database queries
    return NextResponse.json({
      data: getMockLearningPathwayCourses(),
      counts: {
        total: 3,
        filtered: 3,
      },
      debug: {
        message: "Simple API - returning mock data directly",
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error("Simple learning pathway API error:", error);
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
