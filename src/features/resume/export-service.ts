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

  console.log("Attempting to export resume:", resumeId);

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: {
            select: {
              headline: true,
              bio: true,
              location: true,
              certifications: true,
              education: true,
              skills: true,
              interests: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
      experiences: {
        orderBy: { startDate: 'desc' }
      },
      education: {
        orderBy: { order: 'asc' }
      },
      projects: {
        orderBy: { order: 'asc' }
      }
    },
  });

  console.log("Resume query result:", resume ? "found" : "not found");

  if (!resume) {
    throw new Error("Resume not found");
  }

  console.log("Resume data structure validated");

  return {
    id: resume.id,
    title: resume.title,
    summary: resume.summary,
    skills: resume.skills,
    user: {
      email: resume.user.email,
      firstName: resume.user.firstName,
      lastName: resume.user.lastName,
      profile: resume.user.profile,
    },
    experiences: resume.experiences || [],
    education: resume.education || [],
    projects: resume.projects || [],
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
          profile: {
            select: {
              headline: true,
              bio: true,
              location: true,
              certifications: true,
              education: true,
              skills: true,
              interests: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
      experiences: {
        orderBy: { startDate: 'desc' }
      },
      education: {
        orderBy: { order: 'asc' }
      },
      projects: {
        orderBy: { createdAt: 'desc' }
      }
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

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    plainText += "SKILLS\n";
    plainText += resume.skills.join(", ") + "\n\n";
  }

  // Experience
  if (resume.experiences && resume.experiences.length > 0) {
    plainText += "EXPERIENCE\n";
    for (const exp of resume.experiences) {
      plainText += `${exp.role} at ${exp.company}\n`;
      plainText += `${new Date(exp.startDate).toLocaleDateString()} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}\n`;
      if (exp.description) {
        plainText += `${exp.description}\n`;
      }
      if (exp.achievements && exp.achievements.length > 0) {
        for (const achievement of exp.achievements) {
          plainText += `• ${achievement}\n`;
        }
      }
      plainText += "\n";
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    plainText += "EDUCATION\n";
    for (const edu of resume.education) {
      plainText += `${edu.degree || 'Degree'} in ${edu.field || 'Field of Study'}\n`;
      plainText += `${edu.school}\n`;
      if (edu.summary) {
        plainText += `${edu.summary}\n`;
      }
      plainText += "\n";
    }
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    plainText += "PROJECTS\n";
    for (const project of resume.projects) {
      plainText += `${project.name}\n`;
      if (project.description) {
        plainText += `${project.description}\n`;
      }
      if (project.technologies && project.technologies.length > 0) {
        plainText += `Technologies: ${project.technologies.join(", ")}\n`;
      }
      plainText += "\n";
    }
  }

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
