import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { withAuth } from "@/lib/auth/guards";
import { getOpenAIClient } from "@/lib/ai/client";
import {
  optimizeResumeSummary,
  generateAchievementsFromContext,
  generateBulletPoints,
} from "@/lib/ai/resume";

// Simple in-memory rate limiter per user (POC). Limits to 10 requests per 60s window.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateState = new Map<string, { windowStart: number; count: number }>();

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json().catch(() => ({}));
    const section = (body.section as string) || "summary";

    // Require explicit consent for AI generation
    if (!body.consent) {
      return NextResponse.json({ error: "consent_required" }, { status: 400 });
    }

    // Rate limiting (in-memory POC)
    const now = Date.now();
    const state = rateState.get(session.sub) ?? { windowStart: now, count: 0 };
    if (now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
      state.windowStart = now;
      state.count = 0;
    }
    state.count += 1;
    rateState.set(session.sub, state);
    if (state.count > RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    // If OPENAI_API_KEY is not set, return a canned response for POC
    if (!process.env.OPENAI_API_KEY) {
      if (section === "summary") {
        return NextResponse.json({
          section: "summary",
          draft: {
            text: "Experienced product manager with 7+ years in SaaS and marketplace businesses. Delivered cross-functional initiatives that increased ARR by 30% and improved retention by 12%.",
            bullets: [
              "Led a team of 6 product managers and designers to launch a new pricing model resulting in $1.2M ARR.",
              "Built and shipped core onboarding flows, reducing time-to-first-value by 40%.",
            ],
          },
          metadata: { promptHash: uuidv4(), demo: true },
        });
      }

      return NextResponse.json({
        section,
        draft: { text: `Demo draft for section ${section}` },
        metadata: { promptHash: uuidv4(), demo: true },
      });
    }

    // Run simple moderation on user-provided inputs before calling AI
    try {
      const openai = getOpenAIClient();
      const textToCheck = [body.currentSummary, body.targetRole, body.rawDescription, body.contextHighlights?.join("\n")]
        .filter(Boolean)
        .join("\n");

      if (textToCheck) {
        const mod = await openai.moderations.create({ model: "omni-moderation-latest", input: textToCheck });
        const result = mod.results?.[0];
        if (result?.flagged) {
          return NextResponse.json({ error: "content_flagged" }, { status: 400 });
        }
      }
    } catch (modErr) {
      console.warn("Moderation check failed, continuing:", String(modErr));
    }

    // Use the AI resume helpers which internally call OpenAI (and fall back safely)
    if (section === "summary") {
      const requestPayload = {
        currentSummary: body.currentSummary || "",
        experience: body.experience || [],
        skills: body.skills || [],
        targetRole: body.targetRole || undefined,
      };

      const result = await optimizeResumeSummary(requestPayload);

      return NextResponse.json({
        section: "summary",
        draft: { text: result.summary },
        metadata: { promptHash: uuidv4(), usedFallback: result.usedFallback },
      });
    }

    if (section === "achievements") {
      const result = await generateAchievementsFromContext({
        jobTitle: body.jobTitle || "",
        industry: body.industry || undefined,
        contextHighlights: body.contextHighlights || [],
      });

      return NextResponse.json({
        section: "achievements",
        draft: { bullets: result.achievements },
        metadata: { promptHash: uuidv4(), usedFallback: result.usedFallback },
      });
    }

    if (section === "bullets") {
      const requestPayload = {
        company: body.company || "",
        role: body.role || "",
        duration: body.duration || "",
        rawDescription: body.rawDescription || "",
        targetRole: body.targetRole || undefined,
      };

      const result = await generateBulletPoints(requestPayload);

      return NextResponse.json({
        section: "bullets",
        draft: { bullets: result.bulletPoints },
        metadata: { promptHash: uuidv4(), usedFallback: result.usedFallback },
      });
    }

    return NextResponse.json({ section, draft: { text: "Unsupported section" }, metadata: { promptHash: uuidv4() } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
});
