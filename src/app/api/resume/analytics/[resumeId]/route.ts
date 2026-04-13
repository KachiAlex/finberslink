/**
 * GET /api/resume/analytics/:resumeId
 * Get analytics data for a resume with date range filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { analyticsService } from '@/services/analytics/analytics-service';

const logger = new Logger('AnalyticsAPI');

export async function GET(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { resumeId } = params;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month';

    // Validate resume exists and user owns it
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { user: true },
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

    // Parse and validate date range
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default: last 30 days
    let endDate = new Date();

    if (startDateStr) {
      const parsed = new Date(startDateStr);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use ISO 8601 format.' },
          { status: 400 }
        );
      }
      startDate = parsed;
    }

    if (endDateStr) {
      const parsed = new Date(endDateStr);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use ISO 8601 format.' },
          { status: 400 }
        );
      }
      endDate = parsed;
    }

    // Validate date range
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Get analytics data
    const [summary, viewTrends, downloadTrends, shareTrends, sectionEngagement, viewHistory, recentViewers] =
      await Promise.all([
        analyticsService.getSummary(resumeId),
        analyticsService.getViewTrends(resumeId, startDate, endDate, groupBy),
        analyticsService.getDownloadTrends(resumeId, startDate, endDate, groupBy),
        analyticsService.getShareTrends(resumeId, startDate, endDate, groupBy),
        analyticsService.getSectionEngagement(resumeId),
        analyticsService.getViewHistory(resumeId, 50, 0),
        analyticsService.getRecentViewers(resumeId, 10),
      ]);

    logger.info(`Analytics retrieved for resume ${resumeId}`);

    return NextResponse.json(
      {
        resumeId,
        summary,
        trends: {
          views: viewTrends,
          downloads: downloadTrends,
          shares: shareTrends,
        },
        sectionEngagement,
        viewHistory,
        recentViewers,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error retrieving analytics', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
