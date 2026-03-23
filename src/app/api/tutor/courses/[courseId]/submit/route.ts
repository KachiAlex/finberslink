import { NextRequest, NextResponse } from "next/server";

import { submitTutorCourse } from "@/features/tutor/service";
import { verifyToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json({ error: "Tutor access required" }, { status: 403 });
    }

    const course = await submitTutorCourse(params.courseId, user.sub);
    return NextResponse.json({ course }, { status: 200 });
  } catch (error: any) {
    console.error("Tutor course submission error:", error);
    return NextResponse.json({ error: error.message ?? "Failed to submit course" }, { status: 500 });
  }
}
