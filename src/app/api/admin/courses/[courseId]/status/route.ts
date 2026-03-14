import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { updateCourseApprovalStatus } from "@/features/admin/service";
import { verifyToken } from "@/lib/auth/jwt";

const BodySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "CHANGES"]),
});

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status", details: parsed.error.issues }, { status: 400 });
    }

    const courseId = params.courseId;
    await updateCourseApprovalStatus(courseId, parsed.data.status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Course approval update error:", error);
    return NextResponse.json({ error: "Failed to update course status" }, { status: 500 });
  }
}
