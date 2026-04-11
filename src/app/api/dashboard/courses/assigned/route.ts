import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const userId = session.sub;
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "12");

    // Get total count for pagination
    const total = await prisma.courseAssignment.count({
      where: {
        studentId: userId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    // Fetch assigned courses
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        studentId: userId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
      skip,
      take,
      orderBy: { assignedAt: "desc" },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        notes: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            tagline: true,
            level: true,
            category: true,
            coverImage: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get enrolled course IDs for current user
    const enrolledCourseIds = await prisma.enrollment.findMany({
      where: {
        userId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: { courseId: true },
    });

    const enrolledIds = new Set(enrolledCourseIds.map((e) => e.courseId));

    // Filter out enrolled courses and format response
    const filteredAssignments = assignments
      .filter((assignment) => !enrolledIds.has(assignment.course.id))
      .map((assignment) => ({
        assignmentId: assignment.id,
        id: assignment.course.id,
        title: assignment.course.title,
        description: assignment.course.description,
        tagline: assignment.course.tagline,
        level: assignment.course.level,
        category: assignment.course.category,
        coverImage: assignment.course.coverImage,
        instructor: assignment.course.instructor,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        notes: assignment.notes,
        assignedBy: assignment.assignedBy,
        isEnrolled: false,
      }));

    return NextResponse.json({
      data: filteredAssignments,
      pagination: {
        skip,
        take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching assigned courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned courses" },
      { status: 500 }
    );
  }
}
