import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params;
    const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams ?? {};
    const session = await requireSession({ allowedRoles: ["ADMIN", "SUPER_ADMIN"], failureMode: "error" });

    const body = await request.json().catch(() => ({}));
    const { studentId, notes } = body as { studentId?: string; notes?: string };

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const courseId = (params as { courseId?: string }).courseId;
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Confirm course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Create or fetch CourseAssignment
    const assignment = await prisma.courseAssignment.create({
      data: {
        courseId: String(courseId),
        studentId,
        assignedById: session.sub,
        notes: notes ?? null,
      },
    });

    // Ensure an Enrollment exists with PENDING_ACCEPTANCE (or do not overwrite existing enrollments)
    const existingEnrollment = await prisma.enrollment.findFirst({ where: { userId: studentId, courseId: String(courseId) } });

    let enrollment = existingEnrollment;
    if (!existingEnrollment) {
      enrollment = await prisma.enrollment.create({
        data: {
          userId: studentId,
          courseId: String(courseId),
          status: "PENDING_ACCEPTANCE",
        },
      });
    } else if (existingEnrollment.status !== "PENDING_ACCEPTANCE" && existingEnrollment.status !== "ACTIVE") {
      // If enrollment exists but in an unexpected state, update to pending
      enrollment = await prisma.enrollment.update({ where: { id: existingEnrollment.id }, data: { status: "PENDING_ACCEPTANCE" } });
    }

    return NextResponse.json({ assignment, enrollment });
  } catch (error) {
    console.error("Admin assign course failed", error);
    return NextResponse.json({ error: "Failed to assign course" }, { status: 500 });
  }
}
