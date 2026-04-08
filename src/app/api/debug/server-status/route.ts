import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/debug/server-status
 * Check if server is running
 */
export const GET = async (request: NextRequest) => {
  try {
    return NextResponse.json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
};
