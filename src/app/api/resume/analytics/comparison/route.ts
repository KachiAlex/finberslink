/**
 * POST /api/resume/analytics/comparison
 * Compare analytics between two time periods
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { getTrends } from '@/services/analytics/analytics-service';
import { compareSectionEngagement } from '@/services/analytics/section-engagement-service';

const logger = new Logger('AnalyticsComparisonAPI');

export interface ComparisonRequest {
  resumeId: string;
  startDate1: string; // ISO8601
  endDate1: string; // ISO8601
  startDate2: string; // ISO8601
  endDate2: string; // ISO8601
}

export interface ComparisonMetrics {
  period1: {
    totalViews: number;
    totalDownloads: number;
    totalShares: number;
  };
  period2: {
    totalViews: number;
    totalDownloads: number;
    totalShares: number;
  };
  growth: {
    viewsChange: number; // percentage
    viewsAbsoluteChange: number;
    downloadsChange: number; // percentage
    downloadsAbsoluteChange: number;
    sharesChange: number; // percentage
    sharesAbsoluteChange: number;
  };
  sectionComparison: Map<string, {
    period1: number;
    period2: number;
    change: number;
  }>;
}

/**
 * Parse date from ISO8601 string
 */
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Validate date range
 */
function validateDateRange(startDate: Date, endDate: Date): boolean {
  if (startDate > endDate) {
    return false;
  }
  if (startDate > new Date() || endDate > new Date()) {
    return false;
  }
  return true;
}

/**
 * Count events in a date range
 */
async function countEventsByType(
  resumeId: string,
  eventType: 'view' | 'download' | 'share',
  startDate: Date,
  endDate: Date
): Promise<number> {
  return prisma.resumeAnalytics.count({
    where: {
      resumeId,
      eventType,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

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
    const body: ComparisonRequest = await request.json();
    const { resumeId, startDate1: startDate1Str, endDate1: endDate1Str, startDate2: startDate2Str, endDate2: endDate2Str } = body;

    // Validate required parameters
    if (!resumeId || !startDate1Str || !endDate1Str || !startDate2Str || !endDate2Str) {
      return NextResponse.json(
        { error: 'Missing required parameters: resumeId, startDate1, endDate1, startDate2, endDate2' },
        { status: 400 }
      );
    }

    // Verify resume exists and user owns it
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
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
    const startDate1 = parseDate(startDate1Str);
    const endDate1 = parseDate(endDate1Str);
    const startDate2 = parseDate(startDate2Str);
    const endDate2 = parseDate(endDate2Str);

    // Validate dates
    if (!startDate1 || !endDate1 || !startDate2 || !endDate2) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO8601 format (e.g., 2024-01-01T00:00:00Z)' },
        { status: 400 }
      );
    }

    if (!validateDateRange(startDate1, endDate1) || !validateDateRange(startDate2, endDate2)) {
      return NextResponse.json(
        { error: 'Invalid date range: startDate must be before endDate and not in the future' },
        { status: 400 }
      );
    }

    // Get metrics for both periods
    const [
      period1Views,
      period1Downloads,
      period1Shares,
      period2Views,
      period2Downloads,
      period2Shares,
      sectionComparison,
    ] = await Promise.all([
      countEventsByType(resumeId, 'view', startDate1, endDate1),
      countEventsByType(resumeId, 'download', startDate1, endDate1),
      countEventsByType(resumeId, 'share', startDate1, endDate1),
      countEventsByType(resumeId, 'view', startDate2, endDate2),
      countEventsByType(resumeId, 'download', startDate2, endDate2),
      countEventsByType(resumeId, 'share', startDate2, endDate2),
      compareSectionEngagement(resumeId, startDate1, endDate1, startDate2, endDate2),
    ]);

    // Calculate growth metrics
    const calculateChange = (period1: number, period2: number): { percentage: number; absolute: number } => {
      const absolute = period2 - period1;
      const percentage = period1 > 0 ? (absolute / period1) * 100 : period2 > 0 ? 100 : 0;
      return { percentage, absolute };
    };

    const viewsChange = calculateChange(period1Views, period2Views);
    const downloadsChange = calculateChange(period1Downloads, period2Downloads);
    const sharesChange = calculateChange(period1Shares, period2Shares);

    const comparisonData: ComparisonMetrics = {
      period1: {
        totalViews: period1Views,
        totalDownloads: period1Downloads,
        totalShares: period1Shares,
      },
      period2: {
        totalViews: period2Views,
        totalDownloads: period2Downloads,
        totalShares: period2Shares,
      },
      growth: {
        viewsChange: viewsChange.percentage,
        viewsAbsoluteChange: viewsChange.absolute,
        downloadsChange: downloadsChange.percentage,
        downloadsAbsoluteChange: downloadsChange.absolute,
        sharesChange: sharesChange.percentage,
        sharesAbsoluteChange: sharesChange.absolute,
      },
      sectionComparison,
    };

    logger.info(`Analytics comparison generated for resume ${resumeId}`);

    return NextResponse.json(
      {
        resumeId,
        comparison: comparisonData,
        period1: {
          startDate: startDate1.toISOString(),
          endDate: endDate1.toISOString(),
        },
        period2: {
          startDate: startDate2.toISOString(),
          endDate: endDate2.toISOString(),
        },
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error generating analytics comparison', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics comparison' },
      { status: 500 }
    );
  }
}
