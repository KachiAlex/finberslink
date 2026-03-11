import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { recordInterviewResponse } from "@/features/interview/service";
import { requireSession } from "@/lib/auth/session";

const responseSchema = z.object({
  questionId: z.string().min(1),
  transcript: z.string().min(5, "Transcript is required"),
  audioUrl: z.string().url().optional(),
  aiFeedback: z.string().optional(),
  score: z.number().min(0).max(1).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const [body, { sessionId }, session] = await Promise.all([
      request.json(),
      params,
      requireSession({ failureMode: "error" }),
    ]);

    const payload = responseSchema.parse(body);
    const response = await recordInterviewResponse(sessionId, session.sub, payload);
    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("Interview response error:", error);
    return NextResponse.json({ error: "Unable to record interview response" }, { status: 400 });
  }
}
