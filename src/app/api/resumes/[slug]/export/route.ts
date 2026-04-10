import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  convertResumeToPlainText,
  exportResumeAsJSON,
  shareResume,
  publishResumeProfile,
} from "@/features/resume/export-service";
import { requireAuth } from "@/lib/auth/guards";
import { createRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import { prisma } from "../../../../../lib/prisma";
import { generateResumePDF } from "@/lib/pdf-generator";

export const runtime = "nodejs";

const ExportSchema = z.object({
  format: z.enum(["json", "plaintext", "pdf"]),
});

const rateLimitMiddleware = createRateLimit(rateLimitPresets.api);

/**
 * GET /api/resumes/[id]/export
 * Export resume (default format: json) - supports direct navigation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log("Export GET request for slug:", params.slug);
    const session = requireAuth(request);
    console.log("Session validated for user:", session.sub);

    // Find resume by ID
    const resume = await prisma.resume.findFirst({
      where: {
        id: params.slug,
        userId: session.sub,
      },
      select: {
        id: true,
        title: true,
      },
    });

    console.log("Resume found:", resume ? "yes" : "no");

    if (!resume) {
      console.log("Resume not found for ID:", params.slug, "user:", session.sub);
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // Default to JSON format for GET requests
    const result = await exportResumeAsJSON(resume.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error exporting resume:", error);
    return NextResponse.json({ 
      error: "Failed to export resume",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * POST /api/resumes/[id]/export
 * Export resume in specified format by ID
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log("Export POST request for slug:", params.slug);
    const session = requireAuth(request);
    console.log("Session validated for user:", session.sub);
    
    const body = await request.json();
    const validated = ExportSchema.parse(body);
    const { slug } = params;

    console.log("Export format requested:", validated.format);

    // Find resume by ID
    const resume = await prisma.resume.findFirst({
      where: {
        id: slug,
        userId: session.sub,
      },
      select: {
        id: true,
        title: true,
      },
    });

    console.log("Resume found:", resume ? "yes" : "no");

    if (!resume) {
      console.log("Resume not found for ID:", slug, "user:", session.sub);
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    if (validated.format === "json") {
      console.log("Exporting as JSON");
      const result = await exportResumeAsJSON(resume.id);
      return NextResponse.json(result, { status: 200 });
    } else if (validated.format === "plaintext") {
      console.log("Exporting as plaintext");
      const result = await convertResumeToPlainText(resume.id);
      return NextResponse.json({ text: result }, { status: 200 });
    } else if (validated.format === "pdf") {
      console.log("Exporting as PDF");
      try {
        const pdfBuffer = await generateResumePDF(resume.id);
        console.log("PDF generated successfully, size:", pdfBuffer.length);
        
        // Set headers for PDF download
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename="${resume.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume.pdf"`);
        headers.set('Content-Length', pdfBuffer.length.toString());
        
        return new Response(new Uint8Array(pdfBuffer), {
          status: 200,
          headers,
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json(
          { 
            error: "Failed to generate PDF", 
            details: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
          }, 
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.issues);
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    console.error("Error exporting resume:", error);
    return NextResponse.json({ 
      error: "Failed to export resume",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
