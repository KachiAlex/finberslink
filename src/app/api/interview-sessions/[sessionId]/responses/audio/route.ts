import { NextRequest, NextResponse } from "next/server";

import { transcribeInterviewAudio } from "@/features/interview/ai";
import { assertQuestionOwnership } from "@/features/interview/service";
import { requireSession } from "@/lib/auth/session";
import { cloudinary } from "@/lib/cloudinary";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB cap for mock responses

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const [{ sessionId }, session] = await Promise.all([params, requireSession({ failureMode: "error" })]);

    const formData = await request.formData();
    const questionId = formData.get("questionId");
    const file = formData.get("file");

    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio file too large (max 25MB)" }, { status: 400 });
    }

    await assertQuestionOwnership(questionId, sessionId, session.sub);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await cloudinary.uploader.upload(
      `data:${file.type || "audio/webm"};base64,${buffer.toString("base64")}`,
      {
        folder: `interview/${session.sub}/${sessionId}`,
        resource_type: "auto",
        overwrite: false,
        use_filename: true,
        unique_filename: true,
      },
    );

    const transcript = await transcribeInterviewAudio({
      buffer,
      filename: file.name || `interview-${questionId}.webm`,
      mimeType: file.type || "audio/webm",
    });

    return NextResponse.json({ audioUrl: uploadResult.secure_url, transcript });
  } catch (error) {
    console.error("Interview audio upload error", error);
    return NextResponse.json({ error: "Unable to process audio upload" }, { status: 500 });
  }
}
