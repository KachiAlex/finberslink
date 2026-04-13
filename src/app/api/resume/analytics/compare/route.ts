/**
 * POST /api/resume/analytics/compare
 * Compare analytics between two time periods
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { getAnalyticsSummary, getTrends } from '@/services/analytics/analytics-service';

const logger = new Logger('AnalyticsCompareAPI');

export interface ComparisonRequest {
  resumeId: string;
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
}

export interface ComparisonMetrics {
  views: {
    period1: number;
    period2: number;
    change: number;
    changePercent: number;
  };
  downloads: {
    period1: number;
    period2: number;
    change: number;
    changePercent: number;
  };
  shares: {
    period1: number;
    period2: number;
    change: number;
    changePercent: number;
  };
  uniqueViewers: {
    period1: number;
    period2: number;
    change: number;
    changePercent: number;
  };
}

/**
 * Parse date from string
 */
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculate growth metrics
 */
function calculateGrowth(period1: number, period2: number): { change: number; changePercent: number } {
  const change = period2 - period1;
  const changePercent = period1 > 0 ? (change / period1) * 100 : 0;
  return { change, changePercent };
}

/**
 * Get event count for a period
 */
async function getEventCount(
  resumeId: string,
  eventType: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const events = await prisma.resumeAnalytics.findMany({
    where: {
      resumeId,
      eventType,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return events.length;
}

/**
 * Get unique viewer count for a period
 */
async function getUniqueViewerCount(
  resumeId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const views = await prisma.resumeAnalytics.findMany({
    where: {
      resumeId,
      eventType: 'view',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const uniqueViewers = new Set(
    views.filter(v => v.viewerEmail).map(v => v.viewerEmail)
  ).size;

  return uniqueViewers;
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
    const { resumeId, period1Start, period1End, period2Start, period2End } = body;

    // Validate required fields
    if (!resumeId || !period1Start || !period1End || !period2Start || !period2End) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId, period1Start, period1End, period2Start, period2End' },
        { status: 400 }
      );
    }

    // Parse dates
    const p1Start = parseDate(period1Start);
    const p1End = parseDate(period1End);
    const p2Start = parseDate(period2Start);
    const p2End = parseDate(period2End);

    if (!p1Start || !p1End || !p2Start || !p2End) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)' },
        { status: 400 }
      );
    }

    // Validate date ranges
    if (p1Start > p1End) {
      return NextResponse.json(
        { error: 'period1Start must be before period1End' },
        { status: 400 }
      );
    }

    if (p2Start > p2End) {
      return NextResponse.json(
        { error: 'period2Start must be before period2End' },
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

    // Get metrics for both periods
    const [
      p1Views,
      p1Downloads,
      p1Shares,
      p1UniqueViewers,
      p2Views,
      p2Downloads,
      p2Shares,
      p2UniqueViewers,
    ] = await Promise.all([
      getEventCount(resumeId, 'view', p1Start, p1End),
      getEventCount(resumeId, 'download', p1Start, p1End),
      getEventCount(resumeId, 'share', p1Start, p1End),
      getUniqueViewerCount(resumeId, p1Start, p1End),
      getEventCount(resumeId, 'view', p2Start, p2End),
      getEventCount(resumeId, 'download', p2Start, p2End),
      getEventCount(resumeId, 'share', p2Start, p2End),
      getUniqueViewerCount(resumeId, p2Start, p2End),
    ]);

    // Calculate growth metrics
    const comparison: ComparisonMetrics = {
      views: {
        period1: p1Views,
        period2: p2Views,
        ...calculateGrowth(p1Views, p2Views),
      },
      downloads: {
        period1: p1Downloads,
        period2: p2Downloads,
        ...calculateGrowth(p1Downloads, p2Downloads),
      },
      shares: {
        period1: p1Shares,
        period2: p2Shares,
        ...calculateGrowth(p1Shares, p2Shares),
      },
      uniqueViewers: {
        period1: p1UniqueViewers,
        period2: p2UniqueViewers,
        ...calculateGrowth(p1UniqueViewers, p2UniqueViewers),
      },
    };

    logger.info(`Analytics comparison generated for resume ${resumeId}`);

    return NextResponse.json(
      {
        resumeId,
        comparison,
        periods: {
          period1: {
            start: p1Start.toISOString(),
            end: p1End.toISOString(),
          },
          period2: {
            start: p2Start.toISOString(),
            end: p2End.toISOString(),
          },
        },
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error comparing analytics', error);
    return NextResponse.json(
      { error: 'Failed to compare analytics' },
      { status: 500 }
    );
  }
}
