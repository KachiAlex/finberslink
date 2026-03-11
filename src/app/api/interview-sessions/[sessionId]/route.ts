import { NextRequest, NextResponse } from "next/server";
import { InterviewFlowStep, InterviewSessionStatus } from "@prisma/client";
import { z } from "zod";

import { getInterviewSession, updateInterviewSession } from "@/features/interview/service";
import { requireSession } from "@/lib/auth/session";

const updateSessionSchema = z.object({
  status: z.nativeEnum(InterviewSessionStatus).optional(),
  currentStep: z.nativeEnum(InterviewFlowStep).optional(),
  summary: z.string().max(2000).optional(),
  recommendation: z.string().max(4000).optional(),
  rating: z.number().min(1).max(5).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const [{ sessionId }, session] = await Promise.all([params, requireSession({ failureMode: "error" })]);
    const payload = await getInterviewSession(sessionId, session.sub);
    return NextResponse.json({ session: payload });
  } catch (error) {
    console.error("Interview session fetch error:", error);
    return NextResponse.json({ error: "Unable to load interview session" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const [body, { sessionId }, session] = await Promise.all([
      request.json(),
      params,
      requireSession({ failureMode: "error" }),
    ]);

    const payload = updateSessionSchema.parse(body);

    const updated = await updateInterviewSession(sessionId, session.sub, payload);
    return NextResponse.json({ session: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("Interview session update error:", error);
    return NextResponse.json({ error: "Unable to update interview session" }, { status: 400 });
  }
}
