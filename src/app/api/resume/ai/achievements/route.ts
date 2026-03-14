import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateAchievementsFromContext } from "@/lib/ai/resume";
import { verifyToken } from "@/lib/auth/jwt";

const AchievementRequestSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  industry: z.string().optional(),
  experienceHighlights: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    verifyToken(accessToken);

    const body = await request.json();
    const parsed = AchievementRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const achievements = await generateAchievementsFromContext({
      jobTitle: parsed.data.jobTitle,
      industry: parsed.data.industry,
      contextHighlights: parsed.data.experienceHighlights ?? [],
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("AI achievements generation failed", error);
    return NextResponse.json({ error: "Failed to generate achievements" }, { status: 500 });
  }
}
