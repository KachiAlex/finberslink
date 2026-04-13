/**
 * GET /api/resume/analytics/export
 * Export analytics data as CSV or PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { generateCSVReport, generatePDFReportHTML, validateReportDateRange } from '@/services/analytics/report-generator';

const logger = new Logger('AnalyticsExportAPI');

/**
 * Parse date from query parameter
 */
function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId');
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'pdf';
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Validate required parameters
    if (!resumeId) {
      return NextResponse.json(
        { error: 'resumeId is required' },
        { status: 400 }
      );
    }

    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'format must be either "csv" or "pdf"' },
        { status: 400 }
      );
    }

    // Verify resume exists and user owns it
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true, title: true },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse dates
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    // Validate date range
    if (!validateReportDateRange(startDate || undefined, endDate || undefined)) {
      return NextResponse.json(
        { error: 'Invalid date range: startDate must be before endDate and not in the future' },
        { status: 400 }
      );
    }

    // Generate report
    let content: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      content = await generateCSVReport({
        resumeId,
        format: 'csv',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      contentType = 'text/csv';
      filename = `${resume.title || 'resume'}_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      content = await generatePDFReportHTML({
        resumeId,
        format: 'pdf',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      contentType = 'text/html';
      filename = `${resume.title || 'resume'}_analytics_${new Date().toISOString().split('T')[0]}.html`;
    }

    // Record export event
    await prisma.resumeAnalytics.create({
      data: {
        resumeId,
        eventType: 'export',
        metadata: {
          format,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      },
    });

    logger.info(`Analytics report exported for resume ${resumeId} in ${format} format`);

    // Return file
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('Error exporting analytics report', error);
    return NextResponse.json(
      { error: 'Failed to export analytics report' },
      { status: 500 }
    );
  }
}
