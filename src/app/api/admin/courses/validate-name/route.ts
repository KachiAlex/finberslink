/**
 * Course Name Validation Service
 * Prevents duplicate course names from being published
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["TUTOR", "ADMIN", "SUPER_ADMIN"],
      requireTenant: true,
      failureMode: "error",
    });

    const body = await request.json();
    const { title, courseId, instructorId } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Course title is required" },
        { status: 400 }
      );
    }

    console.log("Checking course name validation:", { title, courseId, instructorId });

    // Build query to find existing courses with same title
    const whereClause: any = {
      title: {
        equals: title.trim(),
        mode: 'insensitive' // Case-insensitive comparison
      }
    };

    // If updating an existing course, exclude it from the check
    if (courseId) {
      whereClause.id = { not: courseId };
    }

    // If instructor is specified, check within their courses
    if (instructorId) {
      whereClause.instructorId = instructorId;
    }

    // Find courses with the same title
    const existingCourses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        instructorId: true,
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvalStatus: true,
        archivedAt: true,
        createdAt: true
      },
      take: 10 // Limit to prevent excessive queries
    });

    console.log("Found existing courses with same title:", existingCourses.length);

    // Filter out archived courses (they shouldn't count as duplicates)
    const activeCourses = existingCourses.filter(course => !course.archivedAt);
    
    const isDuplicate = activeCourses.length > 0;
    
    if (isDuplicate) {
      const duplicateInfo = activeCourses.map(course => ({
        id: course.id,
        title: course.title,
        instructor: `${course.instructor.firstName} ${course.instructor.lastName}`,
        status: course.approvalStatus,
        created: course.createdAt
      }));

      return NextResponse.json({
        isValid: false,
        error: "Course title already exists",
        message: `A course with the title "${title}" already exists.`,
        duplicates: duplicateInfo,
        suggestion: "Please choose a different title or modify the existing course."
      }, { status: 409 }); // Conflict status
    }

    return NextResponse.json({
      isValid: true,
      message: "Course title is available",
      existingCourses: existingCourses.length
    });

  } catch (error) {
    console.error("Course name validation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to validate course name", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Additional endpoint to get all course titles for validation
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["TUTOR", "ADMIN", "SUPER_ADMIN"],
      requireTenant: true,
      failureMode: "error",
    });

    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const excludeId = searchParams.get('excludeId');

    const whereClause: any = {};

    if (instructorId) {
      whereClause.instructorId = instructorId;
    }

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    // Get all course titles for validation
    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        instructorId: true,
        archivedAt: true
      },
      orderBy: { title: 'asc' }
    });

    const courseTitles = courses
      .filter(course => !course.archivedAt) // Exclude archived courses
      .map(course => ({
        id: course.id,
        title: course.title,
        instructorId: course.instructorId
      }));

    return NextResponse.json({
      courseTitles,
      count: courseTitles.length
    });

  } catch (error) {
    console.error("Get course titles error:", error);
    return NextResponse.json(
      { error: "Failed to get course titles" },
      { status: 500 }
    );
  }
}
