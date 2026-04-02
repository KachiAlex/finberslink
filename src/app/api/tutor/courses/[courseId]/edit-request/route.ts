import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CourseLevel } from "@prisma/client";

import { verifyToken } from "@/lib/auth/jwt";
import { submitCourseEditRequest } from "@/features/tutor/service";

const BodySchema = z.object({
  title: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  level: z.nativeEnum(CourseLevel),
  coverImage: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

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
    if (!["TUTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Tutor access required" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const course = await submitCourseEditRequest(courseId, user.sub, parsed.data as any);
    return NextResponse.json({ course }, { status: 200 });
  } catch (error: any) {
    console.error("Course edit request error:", error);
    return NextResponse.json({ error: error.message ?? "Failed to submit edit request" }, { status: 500 });
  }
}
