import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Test endpoint to verify database connection and basic queries
 */
export const GET = async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    
    // Test basic database connection
    const userCount = await prisma.user.count();
    const courseCount = await prisma.course.count();
    const enrollmentCount = await prisma.enrollment.count({
      where: { userId: session.sub }
    });
    
    // Test the specific query structure from learning-pathway API
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.sub,
        status: "ACTIVE",
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            lessons: {
              select: { id: true, title: true, order: true },
              orderBy: { order: "asc" },
            },
          },
        },
        lessonProgress: {
          include: {
            lesson: {
              select: { id: true, title: true, order: true },
            },
          },
        },
      },
      take: 1, // Limit to 1 for testing
    });

    return NextResponse.json({
      success: true,
      message: "Database connection test successful",
      data: {
        userCount,
        courseCount,
        enrollmentCount,
        sampleEnrollment: enrollments[0] || null,
        session: {
          userId: session.sub,
          role: session.role,
        },
      },
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};
