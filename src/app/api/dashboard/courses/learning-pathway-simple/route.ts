import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Simplified learning-pathway API for testing
 */
export const GET = async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    console.log("Simplified learning-pathway API for user:", session.sub);
    
    // Return empty array for now - just to test the UI
    return NextResponse.json({
      data: [],
      counts: {
        total: 0,
        filtered: 0,
      },
      debug: {
        userId: session.sub,
        message: "Simplified API - returning empty array for testing"
      }
    });
  } catch (error) {
    console.error("Simplified learning-pathway API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
