import { NextRequest, NextResponse } from "next/server";
import { CourseApprovalStatus } from "@prisma/client";

import { submitTutorCourse } from "@/features/tutor/service";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params;
    const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams ?? {};
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (!["TUTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Tutor or admin access required" }, { status: 403 });
    }

    const courseId = (params as { courseId?: string }).courseId;
    if (!courseId) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId: user.sub },
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      const published = await prisma.course.update({
        where: { id: course.id },
        data: {
          approvalStatus: CourseApprovalStatus.APPROVED,
          tutorEditingLocked: false,
        },
      });

      return NextResponse.json({ course: published }, { status: 200 });
    }

    const course = await submitTutorCourse(courseId, user.sub);
    return NextResponse.json({ course }, { status: 200 });
  } catch (error: any) {
    console.error("Tutor course submission error:", error);
    return NextResponse.json({ error: error.message ?? "Failed to submit course" }, { status: 500 });
  }
}
