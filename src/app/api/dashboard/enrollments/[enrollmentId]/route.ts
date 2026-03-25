import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { enrollmentId: string } }) {
  try {
    const session = await requireSession({ allowedRoles: ["STUDENT"], failureMode: "error" });

    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (!action || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const enrollmentId = params.enrollmentId;

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    if (enrollment.userId !== session.sub) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (action === "accept") {
      const updated = await prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: "ACTIVE" } });

      // Update any pending CourseAssignment for this student/course
      const assignment = await prisma.courseAssignment.findFirst({
        where: { courseId: enrollment.courseId, studentId: session.sub, status: "PENDING" },
      });

      let updatedAssignment = null;
      if (assignment) {
        updatedAssignment = await prisma.courseAssignment.update({
          where: { id: assignment.id },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });
      }

      return NextResponse.json({ enrollment: updated, assignment: updatedAssignment });
    }

    // decline
    const declined = await prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: "WITHDRAWN" } });

    const assignmentToDecline = await prisma.courseAssignment.findFirst({
      where: { courseId: enrollment.courseId, studentId: session.sub, status: "PENDING" },
    });

    let declinedAssignment = null;
    if (assignmentToDecline) {
      declinedAssignment = await prisma.courseAssignment.update({
        where: { id: assignmentToDecline.id },
        data: { status: "DECLINED", declinedAt: new Date() },
      });
    }

    return NextResponse.json({ enrollment: declined, assignment: declinedAssignment });
  } catch (error) {
    console.error("Enrollment action failed", error);
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AuthError, requireAuth } from "@/lib/auth/guards";

const AssignmentActionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function POST(request: NextRequest, { params }: { params: { enrollmentId: string } }) {
  try {
    const session = requireAuth(request);

    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can manage enrollments" }, { status: 403 });
    }

    const parsed = AssignmentActionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action", details: parsed.error.issues }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: params.enrollmentId, userId: session.sub },
      select: { id: true, status: true },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    if (enrollment.status !== "PENDING_ACCEPTANCE") {
      return NextResponse.json({ error: "This enrollment cannot be updated" }, { status: 400 });
    }

    const now = new Date();

    if (parsed.data.action === "accept") {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "ACTIVE",
          acceptedAt: now,
        },
      });
    } else {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "WITHDRAWN",
          acceptedAt: null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }

    console.error("[dashboard/enrollments] unexpected error", error);
    return NextResponse.json({ error: "Unable to update enrollment" }, { status: 500 });
  }
}
