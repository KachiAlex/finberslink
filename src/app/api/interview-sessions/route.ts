import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createInterviewSession, listInterviewSessions } from "@/features/interview/service";
import { requireSession } from "@/lib/auth/session";

const createSessionSchema = z.object({
  targetRole: z.string().min(2, "Target role is required"),
  resumeId: z.string().optional(),
  jobOpportunityId: z.string().optional(),
  initialQuestion: z
    .object({
      prompt: z.string().min(3),
      rubric: z.any().optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    const session = await requireSession({ failureMode: "error" });
    const sessions = await listInterviewSessions(session.sub);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Interview sessions fetch error:", error);
    return NextResponse.json({ error: "Unable to load interview sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const [session, body] = await Promise.all([requireSession({ failureMode: "error" }), request.json()]);
    const payload = createSessionSchema.parse(body);

    const interviewSession = await createInterviewSession({
      userId: session.sub,
      targetRole: payload.targetRole,
      resumeId: payload.resumeId,
      jobOpportunityId: payload.jobOpportunityId,
      initialQuestion: payload.initialQuestion,
    });

    return NextResponse.json({ session: interviewSession }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("Interview session create error:", error);
    return NextResponse.json({ error: "Unable to create interview session" }, { status: 500 });
  }
}
