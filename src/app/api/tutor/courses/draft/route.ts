import { NextRequest, NextResponse } from "next/server";

import { getTutorCourseDraft } from "../../../../../features/tutor/service";
import { verifyToken } from "../../../../../lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (!["TUTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Tutor or admin access required" }, { status: 403 });
    }

    // Only fetch specific course if courseId is provided
    // For new course creation, return null to allow fresh start
    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ course: null }, { status: 200 });
    }

    const course = await getTutorCourseDraft(user.sub, courseId);

    return NextResponse.json({ course }, { status: 200 });
  } catch (error: any) {
    console.error("Tutor course draft fetch error:", error);
    return NextResponse.json({ error: error.message ?? "Failed to fetch draft" }, { status: 500 });
  }
}
