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
