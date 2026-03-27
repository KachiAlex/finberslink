import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { restoreCourse } from "@/features/admin/service";

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params;
    const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams ?? {};
    const courseId = (params as { courseId?: string }).courseId;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await restoreCourse(courseId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Restore course error:", error);
    return NextResponse.json({ error: error.message ?? "Failed to restore course" }, { status: 500 });
  }
}
