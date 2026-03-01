import { NextRequest, NextResponse } from "next/server";

import { analyzeSkills } from "@/lib/ai/resume";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const AnalyzeSkillsSchema = z.object({
  experience: z.array(z.string()),
  targetRole: z.string().optional(),
  jobDescription: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    
    const body = await request.json();
    const parsed = AnalyzeSkillsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const skillAnalysis = await analyzeSkills(parsed.data);
    
    return NextResponse.json(skillAnalysis);
  } catch (error) {
    console.error("Skill analysis error:", error);
    
    if (error instanceof Error && error.message === "Failed to analyze skills") {
      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
