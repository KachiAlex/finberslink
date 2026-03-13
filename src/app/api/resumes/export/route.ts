import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  convertResumTtoPlainText,
  exportResumeAsJSON,
  shareResume,
  publishResumeProfile,
} from "@/features/resume/export-service";
import { requireAuth } from "@/lib/auth/guards";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const ExportSchema = z.object({
  resumeId: z.string().min(1),
  format: z.enum(["json", "plaintext", "pdf"]),
});

const ShareSchema = z.object({
  resumeId: z.string().min(1),
  expiresInDays: z.coerce.number().int().positive().max(365).optional(),
});

const PublishSchema = z.object({
  resumeId: z.string().min(1),
  slug: z.string().min(1),
});

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * POST /api/resumes/export
 * Export resume in specified format
 */
export const POST = rateLimitMiddleware(async (request: NextRequest) => {
  try {
    const session = requireAuth(request);
    const body = await request.json();
    const validated = ExportSchema.parse(body);

    if (validated.format === "json") {
      const result = await exportResumeAsJSON(validated.resumeId);
      return NextResponse.json(result, { status: 200 });
    } else if (validated.format === "plaintext") {
      const result = await convertResumTtoPlainText(validated.resumeId);
      return NextResponse.json({ text: result }, { status: 200 });
    } else if (validated.format === "pdf") {
      // PDF generation would require additional libraries (e.g., jsPDF, puppeteer)
      // For now, return a structure for implementation
      return NextResponse.json(
        {
          message: "PDF export functionality coming soon",
          timestamp: new Date().toISOString(),
          resumeId: validated.resumeId,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    console.error("Error exporting resume:", error);
    return NextResponse.json({ error: "Failed to export resume" }, { status: 500 });
  }
});

