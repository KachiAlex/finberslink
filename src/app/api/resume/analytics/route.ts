/**
 * GET /api/resume/analytics/:resumeId
 * Get analytics dashboard data for a resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { getAnalyticsDashboard } from '@/services/analytics/analytics-service';

const logger = new Logger('AnalyticsDashboardAPI');

/**
 * Parse date from query parameter
 */
function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Validate date range
 */
function validateDateRange(startDate: Date | null, endDate: Date | null): { valid: boolean; error?: string } {
  if (startDate && endDate && startDate > endDate) {
    return { valid: false, error: 'startDate must be before endDate' };
  }

  if (startDate && startDate > new Date()) {
    return { valid: false, error: 'startDate cannot be in the future' };
  }

  if (endDate && endDate > new Date()) {
    return { valid: false, error: 'endDate cannot be in the future' };
  }

  return { valid: true };
}

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

    const resumeId = params.resumeId;

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month';

    // Validate groupBy parameter
    if (!['day', 'week', 'month'].includes(groupBy)) {
      return NextResponse.json(
        { error: 'Invalid groupBy parameter. Must be one of: day, week, month' },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    // Validate date range
    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    // Get analytics dashboard data
    const dashboardData = await getAnalyticsDashboard(
      resumeId,
      startDate || undefined,
      endDate || undefined,
      groupBy
    );

    logger.info(`Analytics dashboard retrieved for resume ${resumeId}`);

    return NextResponse.json(
      {
        resumeId,
        data: dashboardData,
        dateRange: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
        groupBy,
        retrievedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error retrieving analytics dashboard', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resume/analytics/:resumeId
 * Delete analytics data for a resume
 */
export async function DELETE(
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

    const resumeId = params.resumeId;

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

    // Delete analytics data
    const { deleteAnalyticsData } = await import('@/services/analytics/analytics-service');
    await deleteAnalyticsData(resumeId);

    logger.info(`Analytics data deleted for resume ${resumeId}`);

    return NextResponse.json(
      {
        message: 'Analytics data deleted successfully',
        resumeId,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error deleting analytics data', error);
    return NextResponse.json(
      { error: 'Failed to delete analytics data' },
      { status: 500 }
    );
  }
}
