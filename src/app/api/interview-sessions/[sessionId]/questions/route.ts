import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { addInterviewQuestion } from "@/features/interview/service";
import { requireSession } from "@/lib/auth/session";

const createQuestionSchema = z.object({
  prompt: z.string().min(5),
  sequence: z.number().int().positive().optional(),
  rubric: z.any().optional(),
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

    const payload = createQuestionSchema.parse(body);
    const question = await addInterviewQuestion(sessionId, session.sub, payload);
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error("Interview question create error:", error);
    return NextResponse.json({ error: "Unable to add interview question" }, { status: 400 });
  }
}
