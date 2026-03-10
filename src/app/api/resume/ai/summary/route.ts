import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { optimizeResumeSummary } from "@/lib/ai/resume";
import { verifyToken } from "@/lib/auth/jwt";

const SummaryRequestSchema = z.object({
  currentSummary: z.string().optional(),
  experienceHighlights: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  targetRole: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    verifyToken(accessToken);

    const body = await request.json();
    const parsed = SummaryRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const summary = await optimizeResumeSummary({
      currentSummary: parsed.data.currentSummary,
      experience: parsed.data.experienceHighlights,
      skills: parsed.data.skills,
      targetRole: parsed.data.targetRole,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI summary generation failed", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
