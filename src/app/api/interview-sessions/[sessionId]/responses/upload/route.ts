import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "../../../../../../lib/auth/session";
import { prisma } from "../../../../../../lib/prisma";
import { uploadAudioFile, getAudioDuration } from "../../../../../../features/interview/audio-service";
import { transcribeInterviewAudio } from "../../../../../../features/interview/ai";

const uploadSchema = z.object({
  responseId: z.string().min(1, "Response ID is required"),
  filename: z.string().min(1, "Filename is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const [session, { sessionId }] = await Promise.all([
      requireSession({ failureMode: "error" }),
      params,
    ]);

    // Get form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const responseId = formData.get("responseId") as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 },
      );
    }

    if (!responseId) {
      return NextResponse.json(
        { error: "Response ID is required" },
        { status: 400 },
      );
    }

    // Validate file type
    const validMimeTypes = ["audio/webm", "audio/mp3", "audio/mpeg", "audio/wav"];
    if (!validMimeTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Invalid audio format. Supported: ${validMimeTypes.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of 25MB` },
        { status: 400 },
      );
    }

    // Verify response ownership
    const response = await prisma.interviewResponse.findFirst({
      where: {
        id: responseId,
        question: {
          session: {
            id: sessionId,
            userId: session.sub,
          },
        },
      },
      select: { id: true, questionId: true },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Response not found or access denied" },
        { status: 404 },
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    // Get audio duration
    const duration = await getAudioDuration(buffer);

    // Upload audio to Firebase Storage
    const { storageUrl, signedUrl } = await uploadAudioFile({
      buffer,
      filename: audioFile.name,
      responseId,
      duration,
    });

    // Transcribe audio
    let transcript = "";
    try {
      transcript = await transcribeInterviewAudio({
        buffer,
        filename: audioFile.name,
        mimeType: audioFile.type,
      });
    } catch (error) {
      console.error("Transcription failed:", error);
      // Continue without transcript - user can add manually
    }

    // Update response with transcript
    const updatedResponse = await prisma.interviewResponse.update({
      where: { id: responseId },
      data: {
        transcript: transcript || "",
        audioUrl: storageUrl, // Keep for backward compatibility
      },
      select: {
        id: true,
        transcript: true,
        audioUrl: true,
        aiFeedback: true,
        score: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        response: updatedResponse,
        audio: {
          storageUrl,
          signedUrl,
          duration,
        },
        transcript,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Audio upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload audio" },
      { status: 500 },
    );
  }
}
