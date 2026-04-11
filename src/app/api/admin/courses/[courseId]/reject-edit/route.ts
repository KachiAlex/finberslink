import { NextRequest, NextResponse } from "next/server";
import { rejectCourseEdit, requireAdminUser } from "@/features/admin/service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const admin = await requireAdminUser();

    await rejectCourseEdit(courseId, admin);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reject course edit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject course edit" },
      { status: 500 }
    );
  }
}
