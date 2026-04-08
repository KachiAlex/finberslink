import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/features/admin/service";
import { prisma } from "@/lib/prisma";
import { CourseApprovalStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const admin = await requireAdminUser();

    const body = await request.json();
    const { status } = body;

    if (!status || !["APPROVED", "PENDING", "CHANGES"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED, PENDING, or CHANGES" },
        { status: 400 }
      );
    }

    // Update course status
    const course = await prisma.course.findFirst({
      where: { id: courseId },
      select: { id: true }
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { 
        approvalStatus: status as CourseApprovalStatus,
        tutorEditingLocked: status === "APPROVED"
      }
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("Update course status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update course status" },
      { status: 500 }
    );
  }
}
