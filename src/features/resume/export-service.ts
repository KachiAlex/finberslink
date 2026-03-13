import { prisma } from "@/lib/prisma";

export interface ResumeExportFormat {
  format: "pdf" | "docx" | "json";
  includePhoto?: boolean;
  template?: "modern" | "classic" | "minimal";
}

/**
 * Export resume as JSON (for API consumption or sync)
 */
export async function exportResumeAsJSON(resumeId: string) {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: true,
        },
      },
    },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  return {
    id: resume.id,
    title: resume.title,
    summary: resume.summary,
    objective: resume.objective,
    user: {
      email: resume.user.email,
      firstName: resume.user.firstName,
      lastName: resume.user.lastName,
      profile: resume.user.profile,
    },
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

/**
 * Generate PDF export URL for resume
 * In production, this would integrate with a PDF generation service (e.g., puppeteer, pdfkit, or AWS)
 */
export async function generateResumePDFUrl(resumeId: string, options?: ResumeExportFormat): Promise<string> {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  // TODO: Implement actual PDF generation
  // This would use a service like:
  // - puppeteer: https://github.com/puppeteer/puppeteer
  // - pdfkit: http://pdfkit.org/
  // - AWS Lambda + wkhtmltopdf
  // - External API: html2pdf.com, pdflayer.com, etc.

  // For now, return a placeholder URL structure
  const template = options?.template || "modern";
  const format = options?.format || "pdf";

  // Example: generate a presigned URL or API endpoint
  const url = `/api/resumes/${resumeId}/export?format=${format}&template=${template}`;

  return url;
}

/**
 * Get resume export history/versions
 */
export async function getResumeExportHistory(resumeId: string) {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  // TODO: Implement export history tracking
  // This would require an ExportHistory model to track all exports

  return [];
}

/**
 * Get popular resume templates/styles
 */
export async function getResumeTemplates() {
  return [
    {
      id: "modern",
      name: "Modern",
      description: "Clean, contemporary design with sections and accent colors",
      preview: "/templates/resume-modern-preview.png",
    },
    {
      id: "classic",
      name: "Classic",
      description: "Traditional format, ATS-optimized, widely accepted",
      preview: "/templates/resume-classic-preview.png",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Minimalist design, maximum readability",
      preview: "/templates/resume-minimal-preview.png",
    },
  ];
}

/**
 * Convert resume to plain text (useful for ATS systems that can't parse PDFs)
 */
export async function convertResumTtoPlainText(resumeId: string): Promise<string> {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          profile: true,
        },
      },
    },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  let plainText = "";

  // Header
  plainText += `${resume.user.firstName} ${resume.user.lastName}\n`;
  plainText += `${resume.user.email}\n`;
  if (resume.user.profile?.location) {
    plainText += `${resume.user.profile.location}\n`;
  }
  plainText += "\n";

  // Summary
  if (resume.summary) {
    plainText += "PROFESSIONAL SUMMARY\n";
    plainText += resume.summary + "\n\n";
  }

  // Objective
  if (resume.objective) {
    plainText += "OBJECTIVE\n";
    plainText += resume.objective + "\n\n";
  }

  // TODO: Add sections for experience, education, skills, etc.
  // once full resume data structure is loaded

  return plainText;
}

/**
 * Share resume with a specific email or generate public link
 */
export async function shareResume(
  resumeId: string,
  options: {
    public?: boolean;
    expiresIn?: number; // milliseconds
    shareWith?: string[]; // email addresses
  }
) {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  // TODO: Implement resume sharing
  // This would require storing sharing preferences and generating
  // unique share links with optional expiration

  const shareUrl = `/resumes/${resumeId}/share/${generateShareToken()}`;

  return {
    resumeId,
    shareUrl,
    public: options.public || false,
    sharedWith: options.shareWith || [],
    createdAt: new Date(),
    expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn) : null,
  };
}

/**
 * Publish resume as public profile
 */
export async function publishResumeProfile(resumeId: string, slug: string) {
  if (!resumeId || !slug) {
    throw new Error("resumeId and slug are required");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  // TODO: Implement resume publishing
  // Update resume with isPublished flag and custom slug

  return {
    resumeId,
    slug,
    profileUrl: `/profile/${slug}`,
    publishedAt: new Date(),
  };
}

/**
 * Generate a unique share token for resume
 */
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get resume statistics
 */
export async function getResumeStats(resumeId: string) {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  // TODO: Track resume views, downloads, and shares

  return {
    resumeId,
    views: 0,
    downloads: 0,
    shares: 0,
    lastViewed: null,
  };
}
