import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Simple test endpoint to verify API routing is working
 */
export const GET = async (request: NextRequest) => {
  try {
    return NextResponse.json({
      message: "API test endpoint is working",
      timestamp: new Date().toISOString(),
      url: request.url,
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      { error: "Test API failed" },
      { status: 500 }
    );
  }
};
