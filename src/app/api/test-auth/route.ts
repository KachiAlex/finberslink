import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";

export const runtime = "nodejs";

/**
 * Test authentication
 */
export const GET = async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    
    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      data: {
        userId: session.sub,
        role: session.role,
      }
    });
  } catch (error) {
    console.error("Authentication test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 401 }
    );
  }
};
