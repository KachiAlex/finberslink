import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/debug/assign-courses-to-student
 * Assign courses to the student (creates enrollments with status "ASSIGNED")
 */
export const POST = async (request: NextRequest) => {
  try {
    console.log("=== ASSIGN COURSES TO STUDENT ===");
    
    // Get your user account
    const studentUser = await prisma.user.findFirst({
      where: { 
        email: "onyedika.akoma@gmail.com",
        role: "STUDENT"
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true 
      },
    });

    if (!studentUser) {
      return NextResponse.json(
        { success: false, error: "Student user not found" },
        { status: 404 }
      );
    }

    console.log("Found student user:", studentUser.email);

    // Get all approved courses
    const approvedCourses = await prisma.course.findMany({
      where: {
        approvalStatus: "APPROVED",
        publishedAt: { not: null },
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        level: true,
        category: true,
      },
    });

    console.log(`Found ${approvedCourses.length} approved courses`);

    // Create assignments for specific courses (BA with AI and Soft Skills style)
    const coursesToAssign = [
      "Web Development Basics",  // Assign this one
      "Python for Data Science", // And this one
    ];

    const assignments = [];

    for (const courseTitle of coursesToAssign) {
      const course = approvedCourses.find(c => c.title === courseTitle);
      
      if (course) {
        // Check if already assigned
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: studentUser.id,
              courseId: course.id,
            },
          },
        });

        if (!existingEnrollment) {
          // Create assigned enrollment
          const enrollment = await prisma.enrollment.create({
            data: {
              userId: studentUser.id,
              courseId: course.id,
              status: "ASSIGNED", // This makes it an assigned course
              progressPercentage: 0,
              lastAccessedAt: new Date(),
            },
          });

          assignments.push({
            courseId: course.id,
            courseTitle: course.title,
            enrollmentId: enrollment.id,
            status: enrollment.status,
          });

          console.log(`Assigned: ${course.title}`);
        } else {
          // Update existing enrollment to ASSIGNED if it's not already
          if (existingEnrollment.status !== "ASSIGNED") {
            const updatedEnrollment = await prisma.enrollment.update({
              where: { id: existingEnrollment.id },
              data: { status: "ASSIGNED" },
            });

            assignments.push({
              courseId: course.id,
              courseTitle: course.title,
              enrollmentId: updatedEnrollment.id,
              status: updatedEnrollment.status,
            });

            console.log(`Updated to ASSIGNED: ${course.title}`);
          } else {
            console.log(`Already assigned: ${course.title}`);
          }
        }
      } else {
        console.log(`Course not found: ${courseTitle}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Courses assigned successfully",
      data: {
        student: {
          id: studentUser.id,
          email: studentUser.email,
          name: `${studentUser.firstName} ${studentUser.lastName}`,
        },
        coursesAssigned: assignments.length,
        assignments: assignments,
      },
      debug: {
        message: "Created course assignments for student",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Assign courses error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to assign courses",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
