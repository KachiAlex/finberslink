import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { parseResumeFile } from "@/lib/resume/parser";

/**
 * POST /api/resume/parse
 * Server-side resume file parsing endpoint
 * Handles PDF and TXT file parsing with fallback support
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["STUDENT"],
      failureMode: "error",
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Parse the file
    const text = await parseResumeFile(file);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text content could be extracted from the file" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: text.trim(),
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("[POST /api/resume/parse] Error:", error);

    const errorMessage = (error as Error).message || "Failed to parse resume file";

    // Return appropriate error response
    if (errorMessage.includes("Unsupported file type")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or TXT file." },
        { status: 400 }
      );
    }

    if (errorMessage.includes("PDF contains no extractable text")) {
      return NextResponse.json(
        { error: "PDF contains no extractable text. Try uploading as TXT or using OCR externally." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
