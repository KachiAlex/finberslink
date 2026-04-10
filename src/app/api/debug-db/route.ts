import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

/**
 * Debug database contents
 */
export const GET = async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    
    console.log("Debugging database contents for user:", session.sub);
    
    // Check all tables
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, firstName: true, lastName: true, role: true, email: true }
    });
    
    const courses = await prisma.course.findMany({
      take: 5,
      select: { id: true, title: true, slug: true, level: true, category: true, instructorId: true }
    });
    
    const enrollments = await prisma.enrollment.findMany({
      take: 5,
      select: { id: true, userId: true, courseId: true, status: true, progressPercentage: true }
    });
    
    const userEnrollments = await prisma.enrollment.findMany({
      where: { userId: session.sub },
      select: { id: true, courseId: true, status: true, progressPercentage: true }
    });
    
    return NextResponse.json({
      success: true,
      message: "Database debug info",
      data: {
        currentUser: session.sub,
        users: users,
        courses: courses,
        enrollments: enrollments,
        userEnrollments: userEnrollments,
        counts: {
          users: users.length,
          courses: courses.length,
          enrollments: enrollments.length,
          userEnrollments: userEnrollments.length,
        }
      },
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
