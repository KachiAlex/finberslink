import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth/guards";
import { prisma } from "../../../../../lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const userId = session.sub;
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Validate course exists and is approved
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        approvalStatus: true,
        archivedAt: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    if (course.approvalStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Course is not approved" },
        { status: 400 }
      );
    }

    if (course.archivedAt) {
      return NextResponse.json(
        { error: "Course is archived" },
        { status: 400 }
      );
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this course" },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 0,
      },
      select: {
        id: true,
        status: true,
        progressPercentage: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      enrollment,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}
