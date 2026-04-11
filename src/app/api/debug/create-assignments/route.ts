import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/debug/create-assignments
 * Create sample course assignments for testing
 */
export const POST = async (request: NextRequest) => {
  try {
    console.log("=== CREATING SAMPLE ASSIGNMENTS ===");
    
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

    // Get the instructor (look for TUTOR role instead of INSTRUCTOR)
    const instructor = await prisma.user.findFirst({
      where: { 
        role: "TUTOR"
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true 
      },
    });

    if (!instructor) {
      return NextResponse.json(
        { success: false, error: "No tutor/instructor found in database" },
        { status: 404 }
      );
    }

    console.log("Found instructor:", `${instructor.firstName} ${instructor.lastName} (${instructor.email})`);

    // Create sample courses for "BA with AI" and "Soft Skills"
    const sampleCourses = [
      {
        title: "Business Analysis with Artificial Intelligence",
        tagline: "Master business analysis techniques enhanced by AI",
        level: "INTERMEDIATE",
        category: "Business Analysis",
        description: "Learn how to leverage AI tools and techniques for effective business analysis, requirements gathering, and stakeholder management.",
        instructorId: instructor.id,
        publishedAt: new Date(),
      },
      {
        title: "Professional Soft Skills Development",
        tagline: "Essential soft skills for career success",
        level: "BEGINNER", 
        category: "Professional Development",
        description: "Develop critical soft skills including communication, leadership, teamwork, and emotional intelligence for workplace success.",
        instructorId: instructor.id,
        publishedAt: new Date(),
      }
    ];

    console.log("Creating sample courses...");
    const createdCourses = [];

    for (const courseData of sampleCourses) {
      // Check if course already exists
      const existingCourse = await prisma.course.findFirst({
        where: {
          title: courseData.title,
          instructorId: courseData.instructorId,
        },
      });

      if (!existingCourse) {
        const course = await prisma.course.create({
          data: courseData,
        });
        createdCourses.push(course);
        console.log(`Created course: ${course.title}`);
      } else {
        createdCourses.push(existingCourse);
        console.log(`Course already exists: ${existingCourse.title}`);
      }
    }

    // Create assignments (simulated - since CourseAssignment table might not exist)
    console.log("Creating assignments...");
    const assignments = [];

    for (const course of createdCourses) {
      // Since CourseAssignment table might not exist, we'll just create enrollments
      // to simulate assigned courses that the student can see
      
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: studentUser.id,
            courseId: course.id,
          },
        },
      });

      if (!existingEnrollment) {
        // Create enrollment with "ASSIGNED" status to simulate assignment
        const enrollment = await prisma.enrollment.create({
          data: {
            userId: studentUser.id,
            courseId: course.id,
            status: "ASSIGNED", // Use ASSIGNED status instead of ACTIVE
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
        
        console.log(`Created assignment/enrollment for: ${course.title}`);
      } else {
        assignments.push({
          courseId: course.id,
          courseTitle: course.title,
          enrollmentId: existingEnrollment.id,
          status: existingEnrollment.status,
        });
        
        console.log(`Assignment already exists for: ${course.title}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sample assignments created successfully",
      data: {
        student: {
          id: studentUser.id,
          email: studentUser.email,
          name: `${studentUser.firstName} ${studentUser.lastName}`,
        },
        instructor: {
          id: instructor.id,
          email: instructor.email,
          name: `${instructor.firstName} ${instructor.lastName}`,
        },
        courses: createdCourses.map(course => ({
          id: course.id,
          title: course.title,
          level: course.level,
          category: course.category,
          publishedAt: course.publishedAt,
        })),
        assignments: assignments,
      },
      debug: {
        message: "Created sample courses and assignments",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Create assignments error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create assignments",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
