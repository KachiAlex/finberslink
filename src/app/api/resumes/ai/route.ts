import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  extractSkillsFromResume,
  generateResumeBullets,
  generateResumeSummary,
  optimizeResumeForATS,
} from "@/features/resume/ai-service";
import { requireAuth } from "@/lib/auth/guards";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const GenerateBulletsSchema = z.object({
  role: z.string().min(1),
  description: z.string().optional(),
  company: z.string().optional(),
  skills: z.array(z.string()).optional(),
  context: z.string().optional(),
});

const GenerateSummarySchema = z.object({
  experience: z.string().min(1),
  skills: z.array(z.string()).min(1),
  targetRole: z.string().optional(),
  industry: z.string().optional(),
});

const OptimizeForATSSchema = z.object({
  resumeText: z.string().min(10),
  targetJobDescription: z.string().optional(),
});

const ExtractSkillsSchema = z.object({
  resumeText: z.string().min(10),
});

// Rate limit AI operations more strictly
const aiRateLimit = createRateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 requests per minute
});

/**
 * POST /api/resumes/ai/bullets
 * Generate resume bullet points
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  if (url.pathname.includes("/bullets")) {
    try {
      const session = requireAuth(request);
      const body = await request.json();

      const validated = GenerateBulletsSchema.parse(body);

      const result = await generateResumeBullets(validated);

      return NextResponse.json({ bullets: result.bullets }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
      }
      console.error("Error generating bullets:", error);
      return NextResponse.json({ error: "Failed to generate bullets" }, { status: 500 });
    }
  }

  if (url.pathname.includes("/summary")) {
    try {
      const session = requireAuth(request);
      const body = await request.json();

      const validated = GenerateSummarySchema.parse(body);

      const summary = await generateResumeSummary(validated);

      return NextResponse.json({ summary }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
      }
      console.error("Error generating summary:", error);
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }
  }

  if (url.pathname.includes("/optimize")) {
    try {
      const session = requireAuth(request);
      const body = await request.json();

      const validated = OptimizeForATSSchema.parse(body);

      const result = await optimizeResumeForATS(validated);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
      }
      console.error("Error optimizing resume:", error);
      return NextResponse.json({ error: "Failed to optimize resume" }, { status: 500 });
    }
  }

  if (url.pathname.includes("/extract-skills")) {
    try {
      const session = requireAuth(request);
      const body = await request.json();

      const validated = ExtractSkillsSchema.parse(body);

      const skills = await extractSkillsFromResume(validated.resumeText);

      return NextResponse.json({ skills }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
      }
      console.error("Error extracting skills:", error);
      return NextResponse.json({ error: "Failed to extract skills" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
