import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/courses/assigned
 * Get student's assigned cohort courses - No auth version for testing
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("No-auth assigned courses API starting...");
    
    // Return empty array for testing - no assigned courses locally
    return NextResponse.json({
      data: [],
      counts: {
        total: 0,
        filtered: 0,
      },
      debug: {
        message: "No-auth API - returning empty array for testing (no assigned courses)",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("No-auth assigned courses API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch assigned courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
