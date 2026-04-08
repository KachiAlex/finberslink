import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/test/simple
 * Simple test API that doesn't use database
 */
export const GET = async (request: NextRequest) => {
  try {
    return NextResponse.json({
      success: true,
      message: "Simple test API working",
      timestamp: new Date().toISOString(),
      data: [
        {
          id: "test-1",
          title: "Test Course 1",
          level: "beginner",
          category: "Test",
        },
        {
          id: "test-2", 
          title: "Test Course 2",
          level: "advanced",
          category: "Test",
        }
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Test API failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
