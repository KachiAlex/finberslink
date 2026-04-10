import { prisma } from '../../lib/prisma';
import { Resume, ResumeExperience, ResumeProject, ResumeEducation } from '@prisma/client';

export type PDFTemplate = 'Modern' | 'Classic' | 'Minimal';
export type ExportFormat = 'pdf' | 'ats';

export interface ExportOptions {
  template?: PDFTemplate;
  includePhoto?: boolean;
  format?: ExportFormat;
}

export interface ExportMetadata {
  template: string;
  format: string;
  fileSize: number;
  userAgent?: string;
  ipAddress?: string;
}

interface ResumeWithRelations extends Resume {
  experiences: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * PDF Generation Service
 * Handles conversion of resume data to PDF with multiple templates
 */
export class PdfGenerationService {
  /**
   * Generate PDF from resume data
   * Supports Modern, Classic, and Minimal templates
   */
  static async generatePDF(
    resumeId: string,
    template: PDFTemplate = 'Modern',
    options: ExportOptions = {}
  ): Promise<Buffer> {
    try {
      // Fetch resume with all relations
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        include: {
          experiences: { orderBy: { order: 'asc' } },
          projects: { orderBy: { order: 'asc' } },
          education: { orderBy: { order: 'asc' } },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      // Generate HTML based on template
      const html = this.generateHTML(resume as ResumeWithRelations, template, options);

      // Convert HTML to PDF (placeholder - will use puppeteer/pdfkit in implementation)
      const pdfBuffer = await this.htmlToPdf(html, template);

      return pdfBuffer;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate ATS-optimized plain text export
   */
  static async generateATSExport(resumeId: string): Promise<string> {
    try {
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        include: {
          experiences: { orderBy: { order: 'asc' } },
          projects: { orderBy: { order: 'asc' } },
          education: { orderBy: { order: 'asc' } },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      return this.generateATSText(resume as ResumeWithRelations);
    } catch (error) {
      throw new Error(`ATS export generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record export in history
   */
  static async recordExport(
    resumeId: string,
    metadata: ExportMetadata
  ): Promise<void> {
    try {
      await prisma.resumeExport.create({
        data: {
          resumeId,
          template: metadata.template,
          fileSize: metadata.fileSize,
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
        },
      });
    } catch (error) {
      throw new Error(`Failed to record export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get export history with optional filtering
   */
  static async getExportHistory(
    resumeId: string,
    filters?: {
      dateFrom?: Date;
      dateTo?: Date;
      template?: string;
      limit?: number;
    }
  ) {
    try {
      const limit = filters?.limit || 50;

      const exports = await prisma.resumeExport.findMany({
        where: {
          resumeId,
          ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
          ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } }),
          ...(filters?.template && { template: filters.template }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return exports;
    } catch (error) {
      throw new Error(`Failed to retrieve export history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get export statistics
   */
  static async getExportStatistics(resumeId: string) {
    try {
      const exports = await prisma.resumeExport.findMany({
        where: { resumeId },
      });

      const totalExports = exports.length;
      const templateCounts = exports.reduce(
        (acc, exp) => {
          acc[exp.template] = (acc[exp.template] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const mostUsedTemplate = Object.entries(templateCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Modern';

      return {
        totalExports,
        mostUsedTemplate,
        templateBreakdown: templateCounts,
      };
    } catch (error) {
      throw new Error(`Failed to calculate export statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate filename for PDF export
   */
  static generateFilename(firstName: string, lastName: string, template: PDFTemplate): string {
    const timestamp = new Date().getTime();
    const sanitized = `${firstName}_${lastName}`.replace(/[^a-zA-Z0-9_]/g, '');
    return `${sanitized}_${template}_${timestamp}.pdf`;
  }

  /**
   * Generate HTML from resume data based on template
   */
  private static generateHTML(
    resume: ResumeWithRelations,
    template: PDFTemplate,
    options: ExportOptions
  ): string {
    switch (template) {
      case 'Modern':
        return this.generateModernTemplate(resume, options);
      case 'Classic':
        return this.generateClassicTemplate(resume, options);
      case 'Minimal':
        return this.generateMinimalTemplate(resume, options);
      default:
        return this.generateModernTemplate(resume, options);
    }
  }

  /**
   * Modern template with accent colors and sidebar
   */
  private static generateModernTemplate(resume: ResumeWithRelations, options: ExportOptions): string {
    const { user, title, summary, skills, experiences, projects, education, headshotUrl, location } = resume;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title || 'Resume'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
          .container { display: flex; max-width: 8.5in; height: 11in; margin: 0 auto; background: white; }
          .sidebar { width: 30%; background: #f5f5f5; padding: 30px 20px; }
          .main { width: 70%; padding: 30px; }
          .header { margin-bottom: 20px; }
          .name { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .contact { font-size: 11px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 12px; font-weight: bold; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; }
          .item { margin-bottom: 12px; }
          .item-title { font-weight: bold; font-size: 11px; }
          .item-subtitle { font-size: 10px; color: #666; }
          .item-description { font-size: 10px; margin-top: 3px; }
          .skills-list { display: flex; flex-wrap: wrap; gap: 5px; }
          .skill-tag { background: #3498db; color: white; padding: 3px 8px; border-radius: 3px; font-size: 9px; }
          .photo { width: 100px; height: 100px; border-radius: 50%; margin-bottom: 15px; object-fit: cover; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="sidebar">
            ${options.includePhoto && headshotUrl ? `<img src="${headshotUrl}" alt="Photo" class="photo">` : ''}
            <div class="section">
              <div class="section-title">Contact</div>
              <div class="item-description">${user.email}</div>
              ${location ? `<div class="item-description">${location}</div>` : ''}
            </div>
            ${skills.length > 0 ? `
              <div class="section">
                <div class="section-title">Skills</div>
                <div class="skills-list">
                  ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="main">
            <div class="header">
              <div class="name">${user.firstName} ${user.lastName}</div>
              <div class="contact">${title || 'Professional'}</div>
            </div>
            ${summary ? `
              <div class="section">
                <div class="section-title">Summary</div>
                <div class="item-description">${summary}</div>
              </div>
            ` : ''}
            ${experiences.length > 0 ? `
              <div class="section">
                <div class="section-title">Experience</div>
                ${experiences.map(exp => `
                  <div class="item">
                    <div class="item-title">${exp.role}</div>
                    <div class="item-subtitle">${exp.company} • ${exp.startDate.toLocaleDateString()} - ${exp.endDate ? exp.endDate.toLocaleDateString() : 'Present'}</div>
                    ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${education.length > 0 ? `
              <div class="section">
                <div class="section-title">Education</div>
                ${education.map(edu => `
                  <div class="item">
                    <div class="item-title">${edu.degree || 'Degree'}</div>
                    <div class="item-subtitle">${edu.school}</div>
                    ${edu.field ? `<div class="item-description">${edu.field}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${projects.length > 0 ? `
              <div class="section">
                <div class="section-title">Projects</div>
                ${projects.map(proj => `
                  <div class="item">
                    <div class="item-title">${proj.name}</div>
                    ${proj.summary ? `<div class="item-description">${proj.summary}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Classic template with traditional hierarchy
   */
  private static generateClassicTemplate(resume: ResumeWithRelations, options: ExportOptions): string {
    const { user, title, summary, skills, experiences, projects, education, location } = resume;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title || 'Resume'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5; }
          .container { max-width: 8.5in; height: 11in; margin: 0 auto; padding: 40px; background: white; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .name { font-size: 20px; font-weight: bold; }
          .contact { font-size: 10px; margin-top: 5px; }
          .section { margin-bottom: 15px; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 8px; }
          .item { margin-bottom: 10px; }
          .item-title { font-weight: bold; font-size: 11px; }
          .item-subtitle { font-size: 10px; }
          .item-description { font-size: 10px; margin-top: 2px; }
          .skills-list { font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="name">${user.firstName} ${user.lastName}</div>
            <div class="contact">${user.email}${location ? ` • ${location}` : ''}</div>
          </div>
          ${summary ? `
            <div class="section">
              <div class="section-title">Professional Summary</div>
              <div class="item-description">${summary}</div>
            </div>
          ` : ''}
          ${experiences.length > 0 ? `
            <div class="section">
              <div class="section-title">Experience</div>
              ${experiences.map(exp => `
                <div class="item">
                  <div class="item-title">${exp.role}</div>
                  <div class="item-subtitle">${exp.company} | ${exp.startDate.toLocaleDateString()} - ${exp.endDate ? exp.endDate.toLocaleDateString() : 'Present'}</div>
                  ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${education.length > 0 ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${education.map(edu => `
                <div class="item">
                  <div class="item-title">${edu.degree || 'Degree'}</div>
                  <div class="item-subtitle">${edu.school}${edu.field ? ` - ${edu.field}` : ''}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${projects.length > 0 ? `
            <div class="section">
              <div class="section-title">Projects</div>
              ${projects.map(proj => `
                <div class="item">
                  <div class="item-title">${proj.name}</div>
                  ${proj.summary ? `<div class="item-description">${proj.summary}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${skills.length > 0 ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills-list">${skills.join(' • ')}</div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Minimal template - ATS-friendly with minimal formatting
   */
  private static generateMinimalTemplate(resume: ResumeWithRelations, options: ExportOptions): string {
    const { user, title, summary, skills, experiences, projects, education, location } = resume;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title || 'Resume'}</title>
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; color: #000; line-height: 1.4; font-size: 11px; }
          .container { max-width: 8.5in; height: 11in; margin: 0 auto; padding: 30px; background: white; }
          .header { margin-bottom: 15px; }
          .name { font-size: 14px; font-weight: bold; }
          .contact { font-size: 10px; margin-top: 3px; }
          .section { margin-bottom: 12px; }
          .section-title { font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
          .item { margin-bottom: 8px; }
          .item-title { font-weight: bold; }
          .item-subtitle { font-size: 10px; }
          .item-description { font-size: 10px; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="name">${user.firstName} ${user.lastName}</div>
            <div class="contact">${user.email}${location ? ` | ${location}` : ''}</div>
          </div>
          ${summary ? `
            <div class="section">
              <div class="section-title">Summary</div>
              <div class="item-description">${summary}</div>
            </div>
          ` : ''}
          ${experiences.length > 0 ? `
            <div class="section">
              <div class="section-title">Experience</div>
              ${experiences.map(exp => `
                <div class="item">
                  <div class="item-title">${exp.role}</div>
                  <div class="item-subtitle">${exp.company} | ${exp.startDate.toLocaleDateString()} - ${exp.endDate ? exp.endDate.toLocaleDateString() : 'Present'}</div>
                  ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${education.length > 0 ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${education.map(edu => `
                <div class="item">
                  <div class="item-title">${edu.degree || 'Degree'}</div>
                  <div class="item-subtitle">${edu.school}${edu.field ? ` - ${edu.field}` : ''}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${projects.length > 0 ? `
            <div class="section">
              <div class="section-title">Projects</div>
              ${projects.map(proj => `
                <div class="item">
                  <div class="item-title">${proj.name}</div>
                  ${proj.summary ? `<div class="item-description">${proj.summary}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${skills.length > 0 ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="item-description">${skills.join(', ')}</div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate ATS-optimized plain text
   */
  private static generateATSText(resume: ResumeWithRelations): string {
    const { user, title, summary, skills, experiences, projects, education, location } = resume;

    let text = 'ATS-OPTIMIZED RESUME\n';
    text += '='.repeat(50) + '\n\n';

    text += `${user.firstName} ${user.lastName}\n`;
    text += `${user.email}${location ? ` | ${location}` : ''}\n`;
    if (title) text += `${title}\n`;
    text += '\n';

    if (summary) {
      text += 'SUMMARY\n';
      text += '-'.repeat(30) + '\n';
      text += `${summary}\n\n`;
    }

    if (experiences.length > 0) {
      text += 'EXPERIENCE\n';
      text += '-'.repeat(30) + '\n';
      experiences.forEach(exp => {
        text += `${exp.role}\n`;
        text += `${exp.company} | ${exp.startDate.toLocaleDateString()} - ${exp.endDate ? exp.endDate.toLocaleDateString() : 'Present'}\n`;
        if (exp.description) text += `${exp.description}\n`;
        text += '\n';
      });
    }

    if (education.length > 0) {
      text += 'EDUCATION\n';
      text += '-'.repeat(30) + '\n';
      education.forEach(edu => {
        text += `${edu.degree || 'Degree'}\n`;
        text += `${edu.school}${edu.field ? ` - ${edu.field}` : ''}\n`;
        if (edu.summary) text += `${edu.summary}\n`;
        text += '\n';
      });
    }

    if (projects.length > 0) {
      text += 'PROJECTS\n';
      text += '-'.repeat(30) + '\n';
      projects.forEach(proj => {
        text += `${proj.name}\n`;
        if (proj.summary) text += `${proj.summary}\n`;
        text += '\n';
      });
    }

    if (skills.length > 0) {
      text += 'SKILLS\n';
      text += '-'.repeat(30) + '\n';
      text += `${skills.join(', ')}\n`;
    }

    return text;
  }

  /**
   * Convert HTML to PDF (placeholder - will be implemented with puppeteer/pdfkit)
   */
  private static async htmlToPdf(html: string, template: PDFTemplate): Promise<Buffer> {
    // TODO: Implement with puppeteer or pdfkit
    // For now, return empty buffer as placeholder
    return Buffer.from('');
  }
}
