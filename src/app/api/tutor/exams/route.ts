import { NextRequest, NextResponse } from "next/server";

import { createTutorExam, listTutorExams, ExamType } from "@/features/tutor/service";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden - Tutor access required" }, { status: 403 });
    }

    // Removed jwtVerify usage; token already verified via verifyToken

    const exams = await listTutorExams(user.sub);
    return NextResponse.json({ exams });
  } catch (error) {
    console.error("Tutor exams fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden - Tutor access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      courseId,
      type,
      sectionId,
      sectionLabel,
      title,
      description,
      passingScore,
      timeLimit,
      modules,
    } = body ?? {};

    if (!courseId || !type || !title) {
      return NextResponse.json({ error: "courseId, type, and title are required" }, { status: 400 });
    }

    if (type !== "SECTION" && type !== "FINAL") {
      return NextResponse.json({ error: "Invalid exam type" }, { status: 400 });
    }

    const exam = await createTutorExam({
      tutorId: user.sub,
      courseId,
      type: type as ExamType,
      sectionId: sectionId ?? null,
      sectionLabel: sectionLabel ?? null,
      title,
      description: description ?? null,
      passingScore: passingScore ?? null,
      timeLimit: timeLimit ?? null,
      modules: modules ?? [],
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error("Tutor exam create error:", error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
