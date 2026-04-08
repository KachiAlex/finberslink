import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/debug/simple-api-test
 * Simple API test that doesn't use database
 */
export const GET = async (request: NextRequest) => {
  try {
    return NextResponse.json({
      success: true,
      message: "Simple API test working",
      timestamp: new Date().toISOString(),
      serverInfo: {
        nodeEnv: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      mockCourses: [
        {
          id: "mock-1",
          title: "Web Development Basics",
          level: "beginner",
          category: "Web Development",
          instructor: "Cynthia Eguzouwa",
        },
        {
          id: "mock-2", 
          title: "Advanced React Development",
          level: "advanced",
          category: "Frontend Development",
          instructor: "Cynthia Eguzouwa",
        },
        {
          id: "mock-3",
          title: "Python for Data Science", 
          level: "intermediate",
          category: "Data Science",
          instructor: "Cynthia Eguzouwa",
        },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Simple API test failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
};
