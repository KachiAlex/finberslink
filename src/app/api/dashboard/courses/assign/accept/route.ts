import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const userId = session.sub;
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Validate assignment exists and belongs to student
    const assignment = await prisma.courseAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        studentId: true,
        courseId: true,
        status: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.studentId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update assignment status to ACCEPTED
    const updatedAssignment = await prisma.courseAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        acceptedAt: true,
      },
    });

    // Create enrollment for the course
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: assignment.courseId,
        status: EnrollmentStatus.ACTIVE,
        progressPercentage: 0,
      },
      select: {
        id: true,
        status: true,
        progressPercentage: true,
      },
    });

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      enrollment,
    });
  } catch (error) {
    console.error("Error accepting assignment:", error);
    return NextResponse.json(
      { error: "Failed to accept assignment" },
      { status: 500 }
    );
  }
}
