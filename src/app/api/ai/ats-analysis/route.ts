import { NextRequest, NextResponse } from "next/server";

import { analyzeATSMatch } from "@/lib/ai/resume";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const ATSAnalysisSchema = z.object({
  resumeContent: z.string(),
  jobDescription: z.string(),
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
    const parsed = ATSAnalysisSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const atsAnalysis = await analyzeATSMatch(parsed.data);
    
    return NextResponse.json(atsAnalysis);
  } catch (error) {
    console.error("ATS analysis error:", error);
    
    if (error instanceof Error && error.message === "Failed to analyze ATS match") {
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
