import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  convertResumeToPlainText,
  exportResumeAsJSON,
  shareResume,
  publishResumeProfile,
  generateResumePDF,
  generateATSExport,
  getExportHistory,
} from "@/features/resume/export-service";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ExportSchema = z.object({
  resumeId: z.string().min(1),
  format: z.enum(["json", "plaintext", "pdf", "ats"]),
  template: z.enum(["modern", "classic", "minimal"]).optional().default("modern"),
  includePhoto: z.boolean().optional().default(false),
});

const ShareSchema = z.object({
  resumeId: z.string().min(1),
  expiresInDays: z.coerce.number().int().positive().max(365).optional(),
});

const PublishSchema = z.object({
  resumeId: z.string().min(1),
  slug: z.string().min(1),
});

/**
 * POST /api/resumes/export
 * Export resume in specified format
 */
export async function POST(request: NextRequest) {
  try {
    const session = await (await requireAuth(request));
    const body = await request.json();
    const validated = ExportSchema.parse(body);

    // Get user agent and IP for analytics
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;

    if (validated.format === "json") {
      const result = await exportResumeAsJSON(validated.resumeId);
      return NextResponse.json(result, { status: 200 });
    } else if (validated.format === "plaintext") {
      const result = await convertResumeToPlainText(validated.resumeId);
      return NextResponse.json({ text: result }, { status: 200 });
    } else if (validated.format === "ats") {
      const result = await generateATSExport(validated.resumeId);
      return NextResponse.json({ text: result, format: "text/plain" }, { status: 200 });
    } else if (validated.format === "pdf") {
      const { buffer, filename, fileSize } = await generateResumePDF(
        validated.resumeId,
        validated.template as "modern" | "classic" | "minimal",
        { includePhoto: validated.includePhoto, userAgent, ipAddress }
      );

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": fileSize.toString(),
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    console.error("Error exporting resume:", error);
    return NextResponse.json({ error: "Failed to export resume" }, { status: 500 });
  }
}
