import { NextRequest, NextResponse } from "next/server";
import { archiveCourse, requireAdminUser } from "@/features/admin/service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const admin = await requireAdminUser();

    await archiveCourse(courseId, admin);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Archive course error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to archive course" },
      { status: 500 }
    );
  }
}
