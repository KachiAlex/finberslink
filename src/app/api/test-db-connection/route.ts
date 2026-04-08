import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Simple database connection test
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Testing database connection...");
    
    // Test basic database connection
    const userCount = await prisma.user.count();
    const courseCount = await prisma.course.count();
    const enrollmentCount = await prisma.enrollment.count();
    
    console.log("Database connection successful!");
    
    return NextResponse.json({
      success: true,
      message: "Database connection test successful",
      data: {
        userCount,
        courseCount,
        enrollmentCount,
      },
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
