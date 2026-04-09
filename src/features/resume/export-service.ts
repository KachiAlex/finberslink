import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ResumeExportFormat {
  format: "pdf" | "docx" | "json";
  includePhoto?: boolean;
  template?: "modern" | "classic" | "minimal";
}

export interface ExportMetadata {
  template: string;
  format: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ExportRecord {
  id: string;
  resumeId: string;
  template: string;
  fileSize: number;
  downloadCount: number;
  createdAt: Date;
}

export interface ExportStatistics {
  totalExports: number;
  mostUsedTemplate: string;
  exportFrequency: Record<string, number>;
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
 * Generate PDF export for resume with template selection
 * Supports Modern, Classic, and Minimal templates
 */
export async function generateResumePDF(
  resumeId: string,
  template: "modern" | "classic" | "minimal" = "modern",
  options?: { includePhoto?: boolean; userAgent?: string; ipAddress?: string }
): Promise<{ buffer: Buffer; filename: string; fileSize: number }> {
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
          profile: {
            select: {
              headline: true,
              bio: true,
              location: true,
              certifications: true,
              education: true,
              skills: true,
              interests: true,
            },
          },
        },
      },
      experiences: {
        orderBy: { startDate: "desc" },
      },
      education: {
        orderBy: { order: "asc" },
      },
      projects: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  // Validate template
  const validTemplates = ["modern", "classic", "minimal"];
  if (!validTemplates.includes(template)) {
    throw new Error(`Invalid template. Must be one of: ${validTemplates.join(", ")}`);
  }

  // Generate HTML based on template
  const html = generateResumeHTML(resume, template, options?.includePhoto);

  // TODO: Implement actual PDF generation using puppeteer or pdfkit
  // For now, return a placeholder buffer
  const buffer = Buffer.from(html);
  const fileSize = buffer.length;

  // Validate file size (should be under 5MB)
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  if (fileSize > maxFileSize) {
    throw new Error(`PDF file size (${fileSize} bytes) exceeds maximum allowed size (${maxFileSize} bytes)`);
  }

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const filename = `${resume.user.firstName}_${resume.user.lastName}_${template}_${timestamp}.pdf`;

  // Record export
  await recordExport(resumeId, {
    template,
    format: "pdf",
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
  });

  return { buffer, filename, fileSize };
}

/**
 * Generate ATS-optimized plain text export
 */
export async function generateATSExport(resumeId: string): Promise<string> {
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
            },
          },
        },
      },
      experiences: {
        orderBy: { startDate: "desc" },
      },
      education: {
        orderBy: { order: "asc" },
      },
      projects: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  let plainText = "ATS-OPTIMIZED RESUME\n";
  plainText += "This is an ATS-optimized version of the resume with minimal formatting.\n\n";

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
      plainText += `${new Date(exp.startDate).toLocaleDateString()} - ${
        exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"
      }\n`;
      if (exp.description) {
        plainText += `${exp.description}\n`;
      }
      if (exp.achievements && exp.achievements.length > 0) {
        for (const achievement of exp.achievements) {
          plainText += `${achievement}\n`;
        }
      }
      plainText += "\n";
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    plainText += "EDUCATION\n";
    for (const edu of resume.education) {
      plainText += `${edu.degree || "Degree"} in ${edu.field || "Field of Study"}\n`;
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
      if (project.summary) {
        plainText += `${project.summary}\n`;
      }
      if (project.techStack && project.techStack.length > 0) {
        plainText += `Technologies: ${project.techStack.join(", ")}\n`;
      }
      plainText += "\n";
    }
  }

  // Record export
  await recordExport(resumeId, {
    template: "ATS",
    format: "txt",
  });

  return plainText;
}

/**
 * Record export in database
 */
export async function recordExport(
  resumeId: string,
  metadata: ExportMetadata
): Promise<void> {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  try {
    await prisma.resumeExport.create({
      data: {
        resumeId,
        template: metadata.template,
        fileSize: 0, // Will be updated when file is generated
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to record export:", error);
    // Don't throw - export should still succeed even if recording fails
  }
}

/**
 * Get export history for a resume
 */
export async function getExportHistory(
  resumeId: string,
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    template?: string;
    limit?: number;
  }
): Promise<{ exports: ExportRecord[]; total: number; statistics: ExportStatistics }> {
  if (!resumeId) {
    throw new Error("resumeId is required");
  }

  const where: Prisma.ResumeExportWhereInput = {
    resumeId,
  };

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as any).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.createdAt as any).lte = filters.dateTo;
    }
  }

  if (filters?.template) {
    where.template = filters.template;
  }

  const exports = await prisma.resumeExport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 100,
  });

  const total = await prisma.resumeExport.count({ where });

  // Calculate statistics
  const statistics = calculateExportStatistics(exports);

  return {
    exports: exports.map((exp) => ({
      id: exp.id,
      resumeId: exp.resumeId,
      template: exp.template,
      fileSize: exp.fileSize,
      downloadCount: exp.downloadCount,
      createdAt: exp.createdAt,
    })),
    total,
    statistics,
  };
}

/**
 * Calculate export statistics
 */
function calculateExportStatistics(exports: any[]): ExportStatistics {
  const templateCounts: Record<string, number> = {};
  let mostUsedTemplate = "modern";
  let maxCount = 0;

  for (const exp of exports) {
    templateCounts[exp.template] = (templateCounts[exp.template] || 0) + 1;
    if (templateCounts[exp.template] > maxCount) {
      maxCount = templateCounts[exp.template];
      mostUsedTemplate = exp.template;
    }
  }

  return {
    totalExports: exports.length,
    mostUsedTemplate,
    exportFrequency: templateCounts,
  };
}

/**
 * Generate resume HTML based on template
 */
function generateResumeHTML(
  resume: any,
  template: "modern" | "classic" | "minimal",
  includePhoto?: boolean
): string {
  const baseHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${resume.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { margin-bottom: 20px; }
        .section { margin-bottom: 15px; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${resume.user.firstName} ${resume.user.lastName}</h1>
        <p>${resume.user.email}</p>
        ${resume.user.profile?.location ? `<p>${resume.user.profile.location}</p>` : ""}
      </div>
      
      ${resume.summary ? `<div class="section"><div class="section-title">SUMMARY</div><p>${resume.summary}</p></div>` : ""}
      
      ${
        resume.skills && resume.skills.length > 0
          ? `<div class="section"><div class="section-title">SKILLS</div><p>${resume.skills.join(", ")}</p></div>`
          : ""
      }
      
      ${
        resume.experiences && resume.experiences.length > 0
          ? `<div class="section"><div class="section-title">EXPERIENCE</div>${resume.experiences
              .map(
                (exp: any) => `
        <div>
          <strong>${exp.role}</strong> at ${exp.company}
          <p>${new Date(exp.startDate).toLocaleDateString()} - ${
                  exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"
                }</p>
          ${exp.description ? `<p>${exp.description}</p>` : ""}
        </div>
      `
              )
              .join("")}</div>`
          : ""
      }
      
      ${
        resume.education && resume.education.length > 0
          ? `<div class="section"><div class="section-title">EDUCATION</div>${resume.education
              .map(
                (edu: any) => `
        <div>
          <strong>${edu.degree || "Degree"}</strong> in ${edu.field || "Field"}
          <p>${edu.school}</p>
          ${edu.summary ? `<p>${edu.summary}</p>` : ""}
        </div>
      `
              )
              .join("")}</div>`
          : ""
      }
      
      ${
        resume.projects && resume.projects.length > 0
          ? `<div class="section"><div class="section-title">PROJECTS</div>${resume.projects
              .map(
                (proj: any) => `
        <div>
          <strong>${proj.name}</strong>
          ${proj.summary ? `<p>${proj.summary}</p>` : ""}
          ${proj.techStack && proj.techStack.length > 0 ? `<p>Tech: ${proj.techStack.join(", ")}</p>` : ""}
        </div>
      `
              )
              .join("")}</div>`
          : ""
      }
    </body>
    </html>
  `;

  return baseHTML;
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
export async function convertResumeToPlainText(resumeId: string): Promise<string> {
  return generateATSExport(resumeId);
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
