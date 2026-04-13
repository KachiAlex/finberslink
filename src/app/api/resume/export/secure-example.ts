/**
 * Example: Secure Resume Export Endpoint with Full Security Hardening
 * 
 * This file demonstrates how to integrate all security measures into an API endpoint.
 * It shows the recommended pattern for implementing security-hardened endpoints.
 * 
 * To use this pattern in production:
 * 1. Copy the security middleware pattern
 * 2. Apply to all sensitive endpoints
 * 3. Customize the getResourceId function for your endpoint
 * 4. Test thoroughly before deployment
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger";
import { createPdfService } from "@/services/pdf/pdf-service";
import { generateResumeHtml, isValidTemplate, type TemplateType } from "@/services/pdf/templates";

// Security imports
import {
  verifyResumeOwnership,
  extractUserId,
} from "@/lib/security/authorization";
import {
  validateTemplate,
  validateResumeData,
  sanitizeText,
} from "@/lib/security/input-validation";
import {
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  addRateLimitHeaders,
} from "@/lib/rate-limiting";
import {
  logResumeExport,
  logUnauthorizedAccess,
  logRateLimitExceeded,
} from "@/lib/security/audit-logging";
import { createCsrfProtection } from "@/lib/security/csrf";

const logger = new Logger("SecureResumeExportAPI");

/**
 * POST /api/resume/export
 * 
 * Secure resume export endpoint with:
 * - User authentication verification
 * - Resume ownership verification
 * - Rate limiting (10 per hour per user)
 * - CSRF protection
 * - Input validation and sanitization
 * - Audit logging
 * - Comprehensive error handling
 */

// Apply CSRF protection middleware
const csrfProtection = createCsrfProtection({
  protectedMethods: ["POST"],
  oneTimeUse: false,
});

async function handleExport(request: NextRequest): Promise<NextResponse> {
  let userId: string | null = null;
  let resumeId: string | null = null;
  let success = false;
  let errorMessage: string | null = null;

  try {
    // 1. Extract and validate user
    const session = await getServerSession();
    if (!session?.user?.id) {
      errorMessage = "Unauthorized: Missing authentication";
      await logUnauthorizedAccess(request, undefined, "Missing authentication");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    userId = session.user.id;

    // 2. Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      errorMessage = "Invalid JSON in request body";
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { resumeId: requestResumeId, template } = body;

    // 3. Validate required fields
    if (!requestResumeId || !template) {
      errorMessage = "Missing required fields";
      return NextResponse.json(
        { error: "Missing required fields: resumeId, template" },
        { status: 400 }
      );
    }

    resumeId = requestResumeId;

    // 4. Validate template
    if (!validateTemplate(template)) {
      errorMessage = "Invalid template";
      return NextResponse.json(
        { error: "Invalid template. Must be one of: Modern, Classic, Minimal" },
        { status: 400 }
      );
    }

    // 5. Check rate limits
    const rateLimitKey = `export:${userId}`;
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      RATE_LIMIT_CONFIGS.export
    );

    if (!rateLimitResult.allowed) {
      errorMessage = "Rate limit exceeded";
      await logRateLimitExceeded(request, userId, "export");

      const response = NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );

      return addRateLimitHeaders(
        response,
        "export",
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        RATE_LIMIT_CONFIGS.export
      );
    }

    // 6. Verify resume ownership
    const isOwner = await verifyResumeOwnership(resumeId, userId);
    if (!isOwner) {
      errorMessage = "Forbidden: User does not own this resume";
      await logUnauthorizedAccess(
        request,
        userId,
        "Ownership verification failed"
      );

      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 7. Get resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        user: true,
        experiences: true,
        education: true,
        projects: true,
      },
    });

    if (!resume) {
      errorMessage = "Resume not found";
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // 8. Validate resume data
    const resumeDataValidation = validateResumeData({
      firstName: resume.user?.firstName,
      lastName: resume.user?.lastName,
      email: resume.user?.email,
      phone: resume.user?.phone,
      summary: resume.summary,
      experiences: resume.experiences,
      education: resume.education,
      projects: resume.projects,
      skills: resume.skills,
    });

    if (!resumeDataValidation.valid) {
      errorMessage = "Resume data is incomplete";
      return NextResponse.json(
        {
          error: "Resume data is incomplete. Please ensure all required fields are filled.",
          details: resumeDataValidation.errors,
        },
        { status: 400 }
      );
    }

    // 9. Build and sanitize resume data
    const resumeData = {
      firstName: sanitizeText(resume.user!.firstName),
      lastName: sanitizeText(resume.user!.lastName),
      email: resume.user!.email,
      phone: resume.user?.phone ? sanitizeText(resume.user.phone) : undefined,
      location: resume.user?.location ? sanitizeText(resume.user.location) : undefined,
      summary: resume.summary ? sanitizeText(resume.summary) : undefined,
      experiences: (resume.experiences || []).map((exp) => ({
        title: sanitizeText(exp.title),
        company: sanitizeText(exp.company),
        startDate: exp.startDate,
        endDate: exp.endDate || undefined,
        description: exp.description ? sanitizeText(exp.description) : undefined,
        achievements: exp.achievements
          ? (Array.isArray(exp.achievements) ? exp.achievements : []).map(
              (a: string) => sanitizeText(a)
            )
          : undefined,
      })),
      education: (resume.education || []).map((edu) => ({
        school: sanitizeText(edu.school),
        degree: sanitizeText(edu.degree),
        field: sanitizeText(edu.field),
        graduationDate: edu.graduationDate,
      })),
      projects: (resume.projects || []).map((proj) => ({
        name: sanitizeText(proj.name),
        description: proj.description ? sanitizeText(proj.description) : undefined,
        technologies: proj.technologies
          ? (Array.isArray(proj.technologies) ? proj.technologies : []).map(
              (t: string) => sanitizeText(t)
            )
          : undefined,
        link: proj.link ? sanitizeText(proj.link) : undefined,
      })),
      skills: resume.skills
        ? (Array.isArray(resume.skills) ? resume.skills : []).map((s: string) =>
            sanitizeText(s)
          )
        : undefined,
    };

    // 10. Generate HTML from template
    let htmlContent: string;
    try {
      htmlContent = generateResumeHtml(resumeData, template as TemplateType);
    } catch (error) {
      logger.error("Error generating resume HTML", error);
      errorMessage = "Failed to generate resume HTML";
      return NextResponse.json(
        { error: "Failed to generate resume HTML" },
        { status: 500 }
      );
    }

    // 11. Initialize PDF service
    let pdfService;
    try {
      pdfService = await createPdfService();
    } catch (error) {
      logger.error("Error initializing PDF service", error);
      errorMessage = "PDF service is temporarily unavailable";
      return NextResponse.json(
        { error: "PDF service is temporarily unavailable" },
        { status: 503 }
      );
    }

    // 12. Generate PDF
    let result;
    try {
      const fileName = `${sanitizeText(resume.user!.firstName)}_${sanitizeText(
        resume.user!.lastName
      )}_Resume.pdf`;
      result = await pdfService.exportResumePdf({
        resumeId,
        template: template as TemplateType,
        htmlContent,
        fileName,
      });
    } catch (error: any) {
      logger.error("Error generating PDF", error);

      if (error.message?.includes("timeout")) {
        errorMessage = "PDF generation timeout";
        return NextResponse.json(
          { error: "PDF generation took too long, please try again" },
          { status: 504 }
        );
      }

      if (error.message?.includes("size")) {
        errorMessage = "PDF file size exceeded";
        return NextResponse.json(
          { error: "Generated PDF exceeds maximum file size" },
          { status: 413 }
        );
      }

      errorMessage = "Failed to generate PDF";
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }

    // 13. Record export event in analytics
    try {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId,
          eventType: "export",
          metadata: {
            template,
            fileName: result.fileName,
            fileSize: result.fileSize,
          },
        },
      });
    } catch (error) {
      logger.warn("Failed to record export event", error);
      // Don't fail the request if analytics recording fails
    }

    // 14. Log successful export
    success = true;
    await logResumeExport(userId, resumeId, template, true);

    logger.info(`Resume exported successfully: ${resumeId}, template: ${template}`);

    // 15. Create response with rate limit headers
    const response = NextResponse.json(
      {
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );

    return addRateLimitHeaders(
      response,
      "export",
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
      RATE_LIMIT_CONFIGS.export
    );
  } catch (error) {
    logger.error("Error exporting resume", error);
    errorMessage = "Internal server error";

    if (userId && resumeId) {
      await logResumeExport(userId, resumeId, "", false, errorMessage);
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export with CSRF protection
export const POST = csrfProtection(handleExport);
