import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { refreshAudioSignedUrl } from "@/features/interview/audio-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; responseId: string }> },
) {
  try {
    const [session, { sessionId, responseId }] = await Promise.all([
      requireSession({ failureMode: "error" }),
      params,
    ]);

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
      select: {
        id: true,
        audioFile: {
          select: {
            storageUrl: true,
            signedUrl: true,
            expiresAt: true,
            duration: true,
          },
        },
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Response not found or access denied" },
        { status: 404 },
      );
    }

    if (!response.audioFile) {
      return NextResponse.json(
        { error: "No audio file found for this response" },
        { status: 404 },
      );
    }

    // Refresh signed URL if expired
    const signedUrl = await refreshAudioSignedUrl(responseId);

    if (!signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate audio URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      signedUrl,
      expiresAt: response.audioFile.expiresAt,
      duration: response.audioFile.duration,
    });
  } catch (error) {
    console.error("Audio playback error:", error);
    return NextResponse.json(
      { error: "Failed to get audio URL" },
      { status: 500 },
    );
  }
}
