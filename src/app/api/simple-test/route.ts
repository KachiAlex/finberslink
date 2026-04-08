import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Simple test API
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Simple test API working");
    return NextResponse.json({
      success: true,
      message: "Simple test API working",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Simple test API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Simple test API failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
};
