import { NextRequest, NextResponse } from "next/server";

import { generateBulletPoints } from "@/lib/ai/resume";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const GenerateBulletsSchema = z.object({
  company: z.string(),
  role: z.string(),
  duration: z.string(),
  rawDescription: z.string().optional(),
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
    const parsed = GenerateBulletsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const bulletPoints = await generateBulletPoints(parsed.data);
    
    return NextResponse.json({
      bulletPoints,
    });
  } catch (error) {
    console.error("Bullet generation error:", error);
    
    if (error instanceof Error && error.message === "Failed to generate bullet points") {
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
