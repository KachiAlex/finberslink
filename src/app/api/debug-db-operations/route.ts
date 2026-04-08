import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Debug database operations
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Debug database operations...");
    
    // Get first course
    const course = await prisma.course.findFirst({
      select: { id: true, title: true, slug: true }
    });
    
    // Get first student user
    const user = await prisma.user.findFirst({
      where: { role: "STUDENT" },
      select: { id: true, firstName: true, lastName: true }
    });
    
    // Check if enrollment exists
    let existingEnrollment = null;
    if (course && user) {
      existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id
          }
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Database debug successful",
      data: {
        course: course,
        user: user,
        existingEnrollment: existingEnrollment,
        canCreate: !!(course && user && !existingEnrollment)
      }
    });
  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
