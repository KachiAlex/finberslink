/**
 * POST /api/resume/analytics/events
 * Record analytics events for resume views, downloads, shares, and exports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { recordAnalyticsEvent } from '@/services/analytics/analytics-service';

const logger = new Logger('AnalyticsEventsAPI');

interface EventRequest {
  resumeId: string;
  eventType: 'view' | 'download' | 'share' | 'export';
  metadata?: {
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
    country?: string;
    city?: string;
    shareMethod?: string;
    timeSpentSeconds?: number;
    scrollDepth?: number;
    sectionName?: string;
    viewerEmail?: string;
    viewerName?: string;
  };
}

/**
 * Validate event request
 */
function validateEventRequest(body: any): { valid: boolean; error?: string } {
  if (!body.resumeId || typeof body.resumeId !== 'string') {
    return { valid: false, error: 'Missing or invalid resumeId' };
  }

  if (!body.eventType || !['view', 'download', 'share', 'export'].includes(body.eventType)) {
    return { valid: false, error: 'Invalid eventType' };
  }

  if (body.metadata) {
    if (typeof body.metadata !== 'object') {
      return { valid: false, error: 'Invalid metadata format' };
    }

    // Validate numeric fields
    if (body.metadata.timeSpentSeconds !== undefined && typeof body.metadata.timeSpentSeconds !== 'number') {
      return { valid: false, error: 'timeSpentSeconds must be a number' };
    }

    if (body.metadata.scrollDepth !== undefined && typeof body.metadata.scrollDepth !== 'number') {
      return { valid: false, error: 'scrollDepth must be a number' };
    }

    // Validate string fields
    const stringFields = ['deviceType', 'browser', 'operatingSystem', 'country', 'city', 'shareMethod', 'sectionName', 'viewerEmail', 'viewerName'];
    for (const field of stringFields) {
      if (body.metadata[field] !== undefined && typeof body.metadata[field] !== 'string') {
        return { valid: false, error: `${field} must be a string` };
      }
    }
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: EventRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request
    const validation = validateEventRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Verify resume exists
    const resume = await prisma.resume.findUnique({
      where: { id: body.resumeId },
      select: { id: true, userId: true },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Record the event
    const eventId = await recordAnalyticsEvent({
      resumeId: body.resumeId,
      eventType: body.eventType,
      deviceType: body.metadata?.deviceType,
      browser: body.metadata?.browser,
      operatingSystem: body.metadata?.operatingSystem,
      country: body.metadata?.country,
      city: body.metadata?.city,
      shareMethod: body.metadata?.shareMethod,
      timeSpentSeconds: body.metadata?.timeSpentSeconds,
      scrollDepth: body.metadata?.scrollDepth,
      sectionName: body.metadata?.sectionName,
      viewerEmail: body.metadata?.viewerEmail,
      viewerName: body.metadata?.viewerName,
    });

    // Update section engagement if provided
    if (body.metadata?.sectionName && body.metadata?.timeSpentSeconds !== undefined) {
      try {
        const { updateSectionEngagement } = await import('@/services/analytics/analytics-service');
        await updateSectionEngagement(
          body.resumeId,
          body.metadata.sectionName,
          body.metadata.timeSpentSeconds,
          body.metadata.scrollDepth || 0
        );
      } catch (error) {
        logger.warn('Failed to update section engagement', error);
        // Don't fail the request if section engagement update fails
      }
    }

    logger.info(`Analytics event recorded: ${body.eventType} for resume ${body.resumeId}`);

    return NextResponse.json(
      {
        eventId,
        recorded: true,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error recording analytics event', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resume/analytics/events
 * Get analytics events for a resume (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId');
    const eventType = searchParams.get('eventType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing resumeId parameter' },
        { status: 400 }
      );
    }

    // Verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume || resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Build query
    const whereClause: any = { resumeId };
    if (eventType && ['view', 'download', 'share', 'export'].includes(eventType)) {
      whereClause.eventType = eventType;
    }

    // Get events
    const [events, total] = await Promise.all([
      prisma.resumeAnalytics.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.resumeAnalytics.count({ where: whereClause }),
    ]);

    return NextResponse.json(
      {
        events: events.map(e => ({
          id: e.id,
          eventType: e.eventType,
          timestamp: e.createdAt.toISOString(),
          deviceType: e.deviceType,
          browser: e.browser,
          operatingSystem: e.operatingSystem,
          country: e.country,
          city: e.city,
          shareMethod: e.shareMethod,
          timeSpentSeconds: e.timeSpentSeconds,
          scrollDepth: e.scrollDepth,
          sectionName: e.sectionName,
          viewerEmail: e.viewerEmail,
          viewerName: e.viewerName,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error getting analytics events', error);
    return NextResponse.json(
      { error: 'Failed to retrieve events' },
      { status: 500 }
    );
  }
}
