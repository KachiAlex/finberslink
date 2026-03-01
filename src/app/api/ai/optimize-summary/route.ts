import { NextRequest, NextResponse } from "next/server";

import { optimizeResumeSummary } from "@/lib/ai/resume";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const OptimizeSummarySchema = z.object({
  currentSummary: z.string().optional(),
  experience: z.array(z.string()),
  skills: z.array(z.string()),
  targetRole: z.string().optional(),
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
    const parsed = OptimizeSummarySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const optimizedSummary = await optimizeResumeSummary(parsed.data);
    
    return NextResponse.json({
      optimizedSummary,
    });
  } catch (error) {
    console.error("Summary optimization error:", error);
    
    if (error instanceof Error && error.message === "Failed to optimize resume summary") {
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
