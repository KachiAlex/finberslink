import { NextRequest, NextResponse } from "next/server";

import { parseExamImport } from "@/features/tutor/exam-import";
import { verifyToken } from "@/lib/auth/jwt";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (user.role !== "TUTOR") {
      return NextResponse.json({ error: "Tutor access required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Excel file is required" }, { status: 400 });
    }

    if (file.size > MAX_IMPORT_BYTES) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { modules, issues } = parseExamImport(buffer);

    if (modules.length === 0 && issues.length === 0) {
      return NextResponse.json({ error: "No rows detected in spreadsheet" }, { status: 400 });
    }

    return NextResponse.json({ modules, issues });
  } catch (error) {
    console.error("Exam import failed", error);
    const message = error instanceof Error ? error.message : "Failed to import exam";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
