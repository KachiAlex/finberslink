import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/learning-pathway
 * Get student's enrolled courses - No auth version for testing
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("No-auth learning-pathway API starting...");
    
    // Return empty array for testing
    return NextResponse.json({
      data: [],
      counts: {
        total: 0,
        filtered: 0,
      },
      debug: {
        message: "No-auth API - returning empty array for testing",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("No-auth learning-pathway API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
