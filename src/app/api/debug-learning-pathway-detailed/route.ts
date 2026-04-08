import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Debug learning-pathway API to see exact error
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== DEBUG: Starting learning-pathway API ===");
    
    const session = requireAuth(request);
    console.log("Session:", session.sub, session.role);
    
    // Test basic enrollment query
    console.log("Testing basic enrollment query...");
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.sub,
        status: "ACTIVE",
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        progressPercentage: true,
        createdAt: true,
        lastAccessedAt: true,
      }
    });
    
    console.log("Found enrollments:", enrollments.length);
    console.log("Enrollment data:", JSON.stringify(enrollments, null, 2));
    
    return NextResponse.json({
      success: true,
      message: "Debug API successful",
      data: {
        userId: session.sub,
        enrollmentsFound: enrollments.length,
        enrollments: enrollments,
      }
    });
  } catch (error) {
    console.error("=== DEBUG: Error in learning-pathway API ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Debug API failed",
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
