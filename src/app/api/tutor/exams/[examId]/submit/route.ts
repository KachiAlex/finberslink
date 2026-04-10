import { NextRequest, NextResponse } from "next/server";

import { submitTutorExam } from "../../../../../../features/tutor/service";
import { verifyToken } from "../../../../../../lib/auth/jwt";

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params;
    const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams ?? {};
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    if (user.role !== "TUTOR") {
      return NextResponse.json({ error: "Forbidden - Tutor access required" }, { status: 403 });
    }

    const examId = (params as { examId?: string }).examId;
    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    const exam = await submitTutorExam(examId, user.sub);
    return NextResponse.json({ exam }, { status: 200 });
  } catch (error) {
    console.error("Tutor exam submit error:", error);
    return NextResponse.json({ error: "Failed to submit exam" }, { status: 500 });
  }
}
