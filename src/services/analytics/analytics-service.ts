/**
 * Analytics Service
 * 
 * Handles recording, aggregating, and retrieving resume analytics data.
 * Provides metrics calculation, trend analysis, and engagement tracking.
 */

import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

const logger = new Logger('AnalyticsService');

export interface AnalyticsEvent {
  resumeId: string;
  eventType: 'view' | 'download' | 'share' | 'export';
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
  metadata?: Record<string, any>;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  totalExports: number;
  uniqueViewers: number;
  viewToDownloadRatio: number;
  shareToViewRatio: number;
}

export interface TrendPoint {
  date: string;
  value: number;
  change: number;
}

export interface SectionEngagement {
  sectionName: string;
  viewCount: number;
  timeSpentSeconds: number;
  scrollDepth: number;
  engagementPercentage: number;
  rank: number;
}

export interface ViewRecord {
  id: string;
  timestamp: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  country?: string;
  city?: string;
  timeSpentSeconds?: number;
  viewerEmail?: string;
}

export interface ViewerInfo {
  viewerEmail?: string;
  viewerName?: string;
  lastViewedAt: string;
  viewCount: number;
  deviceType?: string;
  country?: string;
}

export interface AnalyticsDashboardData {
  summary: AnalyticsSummary;
  trends: {
    views: TrendPoint[];
    downloads: TrendPoint[];
    shares: TrendPoint[];
    exports: TrendPoint[];
  };
  sectionEngagement: SectionEngagement[];
  viewHistory: ViewRecord[];
  recentViewers: ViewerInfo[];
}

/**
 * Record an analytics event
 */
export async function recordAnalyticsEvent(event: AnalyticsEvent): Promise<string> {
  try {
    const result = await prisma.resumeAnalytics.create({
      data: {
        resumeId: event.resumeId,
        eventType: event.eventType,
        deviceType: event.deviceType,
        browser: event.browser,
        operatingSystem: event.operatingSystem,
        country: event.country,
        city: event.city,
        shareMethod: event.shareMethod,
        timeSpentSeconds: event.timeSpentSeconds,
        scrollDepth: event.scrollDepth,
        sectionName: event.sectionName,
        viewerEmail: event.viewerEmail,
        viewerName: event.viewerName,
        metadata: event.metadata,
      },
    });

    logger.info(`Analytics event recorded: ${event.eventType} for resume ${event.resumeId}`);
    return result.id;
  } catch (error) {
    logger.error('Error recording analytics event', error);
    throw error;
  }
}

/**
 * Get analytics summary for a resume
 */
export async function getAnalyticsSummary(
  resumeId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsSummary> {
  try {
    const whereClause: any = { resumeId };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const events = await prisma.resumeAnalytics.findMany({
      where: whereClause,
    });

    const totalViews = events.filter(e => e.eventType === 'view').length;
    const totalDownloads = events.filter(e => e.eventType === 'download').length;
    const totalShares = events.filter(e => e.eventType === 'share').length;
    const totalExports = events.filter(e => e.eventType === 'export').length;

    // Get unique viewers
    const uniqueViewers = new Set(
      events
        .filter(e => e.eventType === 'view' && e.viewerEmail)
        .map(e => e.viewerEmail)
    ).size;

    const viewToDownloadRatio = totalViews > 0 ? totalDownloads / totalViews : 0;
    const shareToViewRatio = totalViews > 0 ? totalShares / totalViews : 0;

    return {
      totalViews,
      totalDownloads,
      totalShares,
      totalExports,
      uniqueViewers,
      viewToDownloadRatio,
      shareToViewRatio,
    };
  } catch (error) {
    logger.error('Error getting analytics summary', error);
    throw error;
  }
}

/**
 * Get trends for a specific event type
 */
export async function getTrends(
  resumeId: string,
  eventType: 'view' | 'download' | 'share' | 'export',
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<TrendPoint[]> {
  try {
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

    // Convert to trend points with change calculation
    const trends: TrendPoint[] = [];
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

    return trends;
  } catch (error) {
    logger.error('Error getting trends', error);
    throw error;
  }
}

/**
 * Get section engagement data
 */
export async function getSectionEngagement(resumeId: string): Promise<SectionEngagement[]> {
  try {
    const sectionData = await prisma.resumeSectionEngagement.findMany({
      where: { resumeId },
      orderBy: { viewCount: 'desc' },
    });

    // Calculate total time spent across all sections
    const totalTimeSpent = sectionData.reduce((sum, s) => sum + s.totalTimeSpentSeconds, 0);

    // Convert to engagement format with ranking
    return sectionData.map((section, index) => ({
      sectionName: section.sectionName,
      viewCount: section.viewCount,
      timeSpentSeconds: section.totalTimeSpentSeconds,
      scrollDepth: section.averageScrollDepth,
      engagementPercentage:
        totalTimeSpent > 0 ? (section.totalTimeSpentSeconds / totalTimeSpent) * 100 : 0,
      rank: index + 1,
    }));
  } catch (error) {
    logger.error('Error getting section engagement', error);
    throw error;
  }
}

/**
 * Get view history for a resume
 */
export async function getViewHistory(
  resumeId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ViewRecord[]> {
  try {
    const views = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId,
        eventType: 'view',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return views.map(view => ({
      id: view.id,
      timestamp: view.createdAt.toISOString(),
      deviceType: view.deviceType || undefined,
      browser: view.browser || undefined,
      operatingSystem: view.operatingSystem || undefined,
      country: view.country || undefined,
      city: view.city || undefined,
      timeSpentSeconds: view.timeSpentSeconds || undefined,
      viewerEmail: view.viewerEmail || undefined,
    }));
  } catch (error) {
    logger.error('Error getting view history', error);
    throw error;
  }
}

/**
 * Get recent viewers
 */
export async function getRecentViewers(
  resumeId: string,
  limit: number = 10
): Promise<ViewerInfo[]> {
  try {
    const viewers = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId,
        eventType: 'view',
      },
      distinct: ['viewerEmail'],
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get view counts for each viewer
    const viewerMap = new Map<string, ViewerInfo>();

    for (const viewer of viewers) {
      const email = viewer.viewerEmail || 'anonymous';

      if (!viewerMap.has(email)) {
        const viewCount = await prisma.resumeAnalytics.count({
          where: {
            resumeId,
            eventType: 'view',
            viewerEmail: viewer.viewerEmail,
          },
        });

        viewerMap.set(email, {
          viewerEmail: viewer.viewerEmail || undefined,
          viewerName: viewer.viewerName || undefined,
          lastViewedAt: viewer.createdAt.toISOString(),
          viewCount,
          deviceType: viewer.deviceType || undefined,
          country: viewer.country || undefined,
        });
      }
    }

    return Array.from(viewerMap.values());
  } catch (error) {
    logger.error('Error getting recent viewers', error);
    throw error;
  }
}

/**
 * Get complete analytics dashboard data
 */
export async function getAnalyticsDashboard(
  resumeId: string,
  startDate?: Date,
  endDate?: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<AnalyticsDashboardData> {
  try {
    // Set default date range (last 30 days)
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [summary, viewTrends, downloadTrends, shareTrends, exportTrends, sectionEngagement, viewHistory, recentViewers] =
      await Promise.all([
        getAnalyticsSummary(resumeId, start, end),
        getTrends(resumeId, 'view', start, end, groupBy),
        getTrends(resumeId, 'download', start, end, groupBy),
        getTrends(resumeId, 'share', start, end, groupBy),
        getTrends(resumeId, 'export', start, end, groupBy),
        getSectionEngagement(resumeId),
        getViewHistory(resumeId, 50, 0),
        getRecentViewers(resumeId, 10),
      ]);

    return {
      summary,
      trends: {
        views: viewTrends,
        downloads: downloadTrends,
        shares: shareTrends,
        exports: exportTrends,
      },
      sectionEngagement,
      viewHistory,
      recentViewers,
    };
  } catch (error) {
    logger.error('Error getting analytics dashboard', error);
    throw error;
  }
}

/**
 * Update section engagement metrics
 */
export async function updateSectionEngagement(
  resumeId: string,
  sectionName: string,
  timeSpentSeconds: number,
  scrollDepth: number
): Promise<void> {
  try {
    await prisma.resumeSectionEngagement.upsert({
      where: {
        resumeId_sectionName: {
          resumeId,
          sectionName,
        },
      },
      update: {
        viewCount: {
          increment: 1,
        },
        totalTimeSpentSeconds: {
          increment: timeSpentSeconds,
        },
        averageScrollDepth: Math.round(
          (await prisma.resumeSectionEngagement.findUnique({
            where: {
              resumeId_sectionName: {
                resumeId,
                sectionName,
              },
            },
          }))?.averageScrollDepth || 0 + scrollDepth / 2
        ),
        lastUpdatedAt: new Date(),
      },
      create: {
        resumeId,
        sectionName,
        viewCount: 1,
        totalTimeSpentSeconds: timeSpentSeconds,
        averageScrollDepth: scrollDepth,
      },
    });

    logger.info(`Section engagement updated: ${sectionName} for resume ${resumeId}`);
  } catch (error) {
    logger.error('Error updating section engagement', error);
    throw error;
  }
}

/**
 * Delete analytics data for a resume
 */
export async function deleteAnalyticsData(resumeId: string): Promise<void> {
  try {
    await Promise.all([
      prisma.resumeAnalytics.deleteMany({ where: { resumeId } }),
      prisma.resumeSectionEngagement.deleteMany({ where: { resumeId } }),
    ]);

    logger.info(`Analytics data deleted for resume ${resumeId}`);
  } catch (error) {
    logger.error('Error deleting analytics data', error);
    throw error;
  }
}

// Named service object for backwards compatibility
export const analyticsService = {
  getSummary: (resumeId: string) => getAnalyticsSummary(resumeId),
  getViewTrends: (resumeId: string, start: Date, end: Date, groupBy: 'day' | 'week' | 'month') => getTrends(resumeId, 'view', start, end, groupBy),
  getDownloadTrends: (resumeId: string, start: Date, end: Date, groupBy: 'day' | 'week' | 'month') => getTrends(resumeId, 'download', start, end, groupBy),
  getShareTrends: (resumeId: string, start: Date, end: Date, groupBy: 'day' | 'week' | 'month') => getTrends(resumeId, 'share', start, end, groupBy),
  getSectionEngagement: (resumeId: string) => getSectionEngagement(resumeId),
  getViewHistory: (resumeId: string, limit: number, offset: number) => getViewHistory(resumeId, limit, offset),
  getRecentViewers: (resumeId: string, limit: number) => getRecentViewers(resumeId, limit),
};
