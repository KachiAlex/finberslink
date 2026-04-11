import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/debug/user-courses
 * Debug user-specific course data
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== USER COURSES DEBUG ===");
    
    // Find your user account
    const yourUser = await prisma.user.findFirst({
      where: {
        email: "onyedika.akoma@gmail.com",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    
    console.log("Your user:", yourUser);
    
    if (!yourUser) {
      return NextResponse.json({
        success: false,
        error: "User onyedika.akoma@gmail.com not found",
      });
    }
    
    // Check your enrollments
    const yourEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: yourUser.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            publishedAt: true,
          },
        },
      },
    });
    
    console.log(`Your enrollments: ${yourEnrollments.length}`);
    
    // Check for course assignments (if that table exists)
    let yourAssignments = [];
    try {
      yourAssignments = await prisma.courseAssignment.findMany({
        where: {
          studentId: yourUser.id,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              publishedAt: true,
            },
          },
        },
      });
      console.log(`Your assignments: ${yourAssignments.length}`);
    } catch (assignmentError) {
      console.log("CourseAssignment table doesn't exist or error:", assignmentError.message);
    }
    
    // Check all students to see if you're in the right role
    const allStudents = await prisma.user.findMany({
      where: {
        role: "STUDENT",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
    
    console.log(`Total students: ${allStudents.length}`);
    
    return NextResponse.json({
      success: true,
      message: "User courses debug completed",
      data: {
        yourUser: {
          id: yourUser.id,
          email: yourUser.email,
          name: `${yourUser.firstName} ${yourUser.lastName}`,
          role: yourUser.role,
        },
        yourEnrollments: yourEnrollments.map(e => ({
          courseId: e.courseId,
          courseTitle: e.course.title,
          isPublished: !!e.course.publishedAt,
          status: e.status,
          progress: e.progressPercentage,
        })),
        yourAssignments: yourAssignments.map(a => ({
          courseId: a.courseId,
          courseTitle: a.course.title,
          isPublished: !!a.course.publishedAt,
          status: a.status,
        })),
        allStudents: allStudents.map(s => ({
          id: s.id,
          email: s.email,
          name: `${s.firstName} ${s.lastName}`,
          isYou: s.email === "onyedika.akoma@gmail.com",
        })),
      },
      summary: {
        userFound: !!yourUser,
        enrollmentsCount: yourEnrollments.length,
        assignmentsCount: yourAssignments.length,
        totalStudents: allStudents.length,
      },
      debug: {
        timestamp: new Date().toISOString(),
        message: "User-specific course debugging",
      }
    });
  } catch (error) {
    console.error("User courses debug error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to debug user courses",
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
};
