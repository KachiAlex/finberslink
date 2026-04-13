import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { createPdfService } from '@/services/pdf/pdf-service';
import { generateResumeHtml, isValidTemplate, type TemplateType } from '@/services/pdf/templates';

const logger = new Logger('ResumeExportAPI');

/**
 * POST /api/resume/export
 * Export resume as PDF
 * 
 * Request body:
 * {
 *   resumeId: string
 *   template: 'Modern' | 'Classic' | 'Minimal'
 * }
 * 
 * Response:
 * {
 *   downloadUrl: string
 *   fileName: string
 *   fileSize: number
 *   generatedAt: ISO8601
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { resumeId, template } = body;

    // Validate required fields
    if (!resumeId || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId, template' },
        { status: 400 }
      );
    }

    // Validate template
    if (!isValidTemplate(template)) {
      return NextResponse.json(
        { error: 'Invalid template. Must be one of: Modern, Classic, Minimal' },
        { status: 400 }
      );
    }

    // Get resume from database with all related data
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
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate resume has required data
    if (!resume.user?.firstName || !resume.user?.lastName || !resume.user?.email) {
      return NextResponse.json(
        { error: 'Resume data is incomplete. Please ensure first name, last name, and email are filled.' },
        { status: 400 }
      );
    }

    // Build resume data for template
    const resumeData = {
      firstName: resume.user.firstName,
      lastName: resume.user.lastName,
      email: resume.user.email,
      phone: resume.user.phone || undefined,
      location: resume.user.location || undefined,
      summary: resume.summary || undefined,
      experiences: (resume.experiences || []).map(exp => ({
        title: exp.title,
        company: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate || undefined,
        description: exp.description || undefined,
        achievements: exp.achievements ? (Array.isArray(exp.achievements) ? exp.achievements : []) : undefined,
      })),
      education: (resume.education || []).map(edu => ({
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
        graduationDate: edu.graduationDate,
      })),
      projects: (resume.projects || []).map(proj => ({
        name: proj.name,
        description: proj.description || undefined,
        technologies: proj.technologies ? (Array.isArray(proj.technologies) ? proj.technologies : []) : undefined,
        link: proj.link || undefined,
      })),
      skills: resume.skills ? (Array.isArray(resume.skills) ? resume.skills : []) : undefined,
    };

    // Generate HTML from template
    let htmlContent: string;
    try {
      htmlContent = generateResumeHtml(resumeData, template as TemplateType);
    } catch (error) {
      logger.error('Error generating resume HTML', error);
      return NextResponse.json(
        { error: 'Failed to generate resume HTML' },
        { status: 500 }
      );
    }

    // Initialize PDF service
    let pdfService;
    try {
      pdfService = await createPdfService();
    } catch (error) {
      logger.error('Error initializing PDF service', error);
      return NextResponse.json(
        { error: 'PDF service is temporarily unavailable' },
        { status: 503 }
      );
    }

    // Generate PDF
    let result;
    try {
      const fileName = `${resume.user.firstName}_${resume.user.lastName}_Resume.pdf`;
      result = await pdfService.exportResumePdf({
        resumeId,
        template: template as TemplateType,
        htmlContent,
        fileName,
      });
    } catch (error: any) {
      logger.error('Error generating PDF', error);
      
      // Handle specific error cases
      if (error.message?.includes('timeout')) {
        return NextResponse.json(
          { error: 'PDF generation took too long, please try again' },
          { status: 504 }
        );
      }
      
      if (error.message?.includes('size')) {
        return NextResponse.json(
          { error: 'Generated PDF exceeds maximum file size' },
          { status: 413 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      );
    }

    // Record export event in analytics
    try {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId,
          eventType: 'export',
          metadata: {
            template,
            fileName: result.fileName,
            fileSize: result.fileSize,
          },
        },
      });
    } catch (error) {
      logger.warn('Failed to record export event', error);
      // Don't fail the request if analytics recording fails
    }

    logger.info(`Resume exported successfully: ${resumeId}, template: ${template}`);

    return NextResponse.json(
      {
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error exporting resume', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
