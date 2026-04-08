import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Public database debug (no auth required)
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("Public database debug");
    
    // Check basic tables without auth
    const userCount = await prisma.user.count();
    const courseCount = await prisma.course.count();
    const enrollmentCount = await prisma.enrollment.count();
    
    // Get sample data
    const users = await prisma.user.findMany({
      take: 3,
      select: { id: true, firstName: true, lastName: true, role: true }
    });
    
    const courses = await prisma.course.findMany({
      take: 3,
      select: { id: true, title: true, slug: true, level: true, category: true }
    });
    
    return NextResponse.json({
      success: true,
      message: "Public database debug info",
      data: {
        counts: {
          users: userCount,
          courses: courseCount,
          enrollments: enrollmentCount,
        },
        sampleUsers: users,
        sampleCourses: courses,
      },
    });
  } catch (error) {
    console.error("Public database debug error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Public database debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
