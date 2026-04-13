/**
 * Lazy Loading Service
 * 
 * Implements lazy loading strategies for analytics dashboard and other heavy components.
 * Provides progressive data loading and pagination support.
 */

import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const logger = new Logger('LazyLoadingService');

interface LazyLoadOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface LazyLoadResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
}

/**
 * Lazy load analytics dashboard data
 */
export async function lazyLoadAnalyticsDashboard(
  resumeId: string,
  options: LazyLoadOptions = {}
): Promise<LazyLoadResult<any>> {
  try {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count for pagination
    const total = await prisma.resumeAnalytics.count({
      where: { resumeId },
    });

    // Load analytics data with pagination
    const analytics = await prisma.resumeAnalytics.findMany({
      where: { resumeId },
      orderBy: {
        [options.sortBy || 'createdAt']: options.sortOrder || 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        deviceType: true,
        country: true,
        viewerEmail: true,
      },
    });

    const hasMore = offset + limit < total;
    const nextOffset = hasMore ? offset + limit : offset;

    logger.debug(
      `Lazy loaded ${analytics.length} analytics records for resume ${resumeId}`
    );

    return {
      data: analytics,
      total,
      hasMore,
      nextOffset,
    };
  } catch (error) {
    logger.error('Error lazy loading analytics dashboard', error);
    throw error;
  }
}

/**
 * Lazy load view history
 */
export async function lazyLoadViewHistory(
  resumeId: string,
  options: LazyLoadOptions = {}
): Promise<LazyLoadResult<any>> {
  try {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get total count
    const total = await prisma.resumeAnalytics.count({
      where: {
        resumeId,
        eventType: 'view',
      },
    });

    // Load view history with pagination
    const views = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId,
        eventType: 'view',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        createdAt: true,
        deviceType: true,
        browser: true,
        operatingSystem: true,
        country: true,
        city: true,
        timeSpentSeconds: true,
        viewerEmail: true,
      },
    });

    const hasMore = offset + limit < total;
    const nextOffset = hasMore ? offset + limit : offset;

    logger.debug(
      `Lazy loaded ${views.length} view records for resume ${resumeId}`
    );

    return {
      data: views,
      total,
      hasMore,
      nextOffset,
    };
  } catch (error) {
    logger.error('Error lazy loading view history', error);
    throw error;
  }
}

/**
 * Lazy load section engagement data
 */
export async function lazyLoadSectionEngagement(
  resumeId: string,
  options: LazyLoadOptions = {}
): Promise<LazyLoadResult<any>> {
  try {
    const limit = options.limit || 10;
    const offset = options.offset || 0;

    // Get total count
    const total = await prisma.resumeSectionEngagement.count({
      where: { resumeId },
    });

    // Load section engagement with pagination
    const sections = await prisma.resumeSectionEngagement.findMany({
      where: { resumeId },
      orderBy: { viewCount: 'desc' },
      take: limit,
      skip: offset,
      select: {
        sectionName: true,
        viewCount: true,
        totalTimeSpentSeconds: true,
        averageScrollDepth: true,
      },
    });

    // Calculate engagement percentages
    const totalTimeSpent = sections.reduce((sum, s) => sum + s.totalTimeSpentSeconds, 0);

    const data = sections.map((section, index) => ({
      sectionName: section.sectionName,
      viewCount: section.viewCount,
      timeSpentSeconds: section.totalTimeSpentSeconds,
      scrollDepth: section.averageScrollDepth,
      engagementPercentage:
        totalTimeSpent > 0 ? (section.totalTimeSpentSeconds / totalTimeSpent) * 100 : 0,
      rank: offset + index + 1,
    }));

    const hasMore = offset + limit < total;
    const nextOffset = hasMore ? offset + limit : offset;

    logger.debug(
      `Lazy loaded ${sections.length} section engagement records for resume ${resumeId}`
    );

    return {
      data,
      total,
      hasMore,
      nextOffset,
    };
  } catch (error) {
    logger.error('Error lazy loading section engagement', error);
    throw error;
  }
}

/**
 * Lazy load recent viewers
 */
export async function lazyLoadRecentViewers(
  resumeId: string,
  options: LazyLoadOptions = {}
): Promise<LazyLoadResult<any>> {
  try {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get unique viewers with their latest view info
    const viewers = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId,
        eventType: 'view',
        viewerEmail: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['viewerEmail'],
      take: limit,
      skip: offset,
      select: {
        viewerEmail: true,
        viewerName: true,
        createdAt: true,
        deviceType: true,
        country: true,
      },
    });

    // Get view counts for each viewer
    const viewerEmails = viewers.map(v => v.viewerEmail).filter(Boolean);
    const viewCounts = await Promise.all(
      viewerEmails.map(email =>
        prisma.resumeAnalytics.count({
          where: {
            resumeId,
            eventType: 'view',
            viewerEmail: email,
          },
        })
      )
    );

    const data = viewers.map((viewer, index) => ({
      viewerEmail: viewer.viewerEmail,
      viewerName: viewer.viewerName,
      lastViewedAt: viewer.createdAt.toISOString(),
      viewCount: viewCounts[index],
      deviceType: viewer.deviceType,
      country: viewer.country,
    }));

    // Get total unique viewers
    const totalViewers = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId,
        eventType: 'view',
        viewerEmail: { not: null },
      },
      distinct: ['viewerEmail'],
      select: { viewerEmail: true },
    });

    const hasMore = offset + limit < totalViewers.length;
    const nextOffset = hasMore ? offset + limit : offset;

    logger.debug(
      `Lazy loaded ${viewers.length} recent viewers for resume ${resumeId}`
    );

    return {
      data,
      total: totalViewers.length,
      hasMore,
      nextOffset,
    };
  } catch (error) {
    logger.error('Error lazy loading recent viewers', error);
    throw error;
  }
}

/**
 * Lazy load trends data
 */
export async function lazyLoadTrends(
  resumeId: string,
  eventType: 'view' | 'download' | 'share' | 'export',
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day',
  options: LazyLoadOptions = {}
): Promise<LazyLoadResult<any>> {
  try {
    // Get events for the date range
    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId,
        eventType,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    // Group events by date
    const grouped = new Map<string, number>();

    events.forEach(event => {
      let dateKey: string;

      if (groupBy === 'day') {
        dateKey = event.createdAt.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const date = new Date(event.createdAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      } else {
        // month
        dateKey = event.createdAt.toISOString().substring(0, 7);
      }

      grouped.set(dateKey, (grouped.get(dateKey) || 0) + 1);
    });

    // Convert to trend points
    const trends: any[] = [];
    let previousValue = 0;

    Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .forEach(([date, value]) => {
        const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
        trends.push({
          date,
          value,
          change,
        });
        previousValue = value;
      });

    // Apply pagination
    const limit = options.limit || trends.length;
    const offset = options.offset || 0;
    const paginatedTrends = trends.slice(offset, offset + limit);

    const hasMore = offset + limit < trends.length;
    const nextOffset = hasMore ? offset + limit : offset;

    logger.debug(
      `Lazy loaded ${paginatedTrends.length} trend points for resume ${resumeId}`
    );

    return {
      data: paginatedTrends,
      total: trends.length,
      hasMore,
      nextOffset,
    };
  } catch (error) {
    logger.error('Error lazy loading trends', error);
    throw error;
  }
}

/**
 * Prefetch analytics data for faster initial load
 */
export async function prefetchAnalyticsData(resumeId: string): Promise<void> {
  try {
    logger.debug(`Prefetching analytics data for resume ${resumeId}`);

    // Prefetch in parallel
    await Promise.all([
      lazyLoadAnalyticsDashboard(resumeId, { limit: 20 }),
      lazyLoadViewHistory(resumeId, { limit: 50 }),
      lazyLoadSectionEngagement(resumeId, { limit: 10 }),
      lazyLoadRecentViewers(resumeId, { limit: 20 }),
    ]);

    logger.debug(`Prefetch completed for resume ${resumeId}`);
  } catch (error) {
    logger.error('Error prefetching analytics data', error);
    // Don't throw - prefetch failures shouldn't block the main flow
  }
}
