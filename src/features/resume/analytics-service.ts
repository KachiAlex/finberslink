import { prisma } from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';
import { NotificationService } from './notification-service';

export interface ViewMetadata {
  userAgent?: string;
  ipAddress?: string;
  viewerEmail?: string;
}

export interface Viewer {
  id: string;
  resumeId: string;
  shareToken: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  country?: string;
  city?: string;
  viewerEmail?: string;
  timeSpentSeconds?: number;
  createdAt: Date;
}

export interface AnalyticsData {
  totalViews: number;
  uniqueViewers: number;
  viewTrend: Array<{ date: string; count: number }>;
  recentViewers: Viewer[];
  downloadCount: number;
  downloadToViewRatio: number;
  shareCount: number;
  shareToViewRatio: number;
}

/**
 * Analytics Service
 * Records and aggregates view/engagement data
 */
export class AnalyticsService {
  private static readonly AGGREGATION_THRESHOLD = 10000;
  private static readonly HOURLY_RETENTION_DAYS = 30;

  /**
   * Record view event
   */
  static async recordView(
    resumeId: string,
    shareToken: string,
    metadata: ViewMetadata
  ): Promise<void> {
    try {
      // Parse user agent
      const parser = new UAParser(metadata.userAgent);
      const result = parser.getResult();

      // Extract device type
      const deviceType = this.getDeviceType(result.device.type);

      // TODO: Extract geographic location from IP address
      // For now, we'll leave country and city as null
      // In production, use a GeoIP service like MaxMind

      await prisma.resumeView.create({
        data: {
          resumeId,
          shareToken,
          deviceType,
          browser: result.browser.name,
          operatingSystem: result.os.name,
          userAgent: metadata.userAgent,
          viewerEmail: metadata.viewerEmail,
        },
      });

      // Trigger notification for view (async, non-blocking)
      NotificationService.createNotification(resumeId, {
        type: 'view',
        viewerEmail: metadata.viewerEmail,
        viewerName: undefined,
      }).catch(err => {
        console.error('Failed to create view notification:', err);
      });

      // Check if aggregation is needed
      await this.checkAndAggregate(resumeId);
    } catch (error) {
      throw new Error(`Failed to record view: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record download event
   */
  static async recordDownload(exportId: string): Promise<void> {
    try {
      const exportRecord = await prisma.resumeExport.findUnique({
        where: { id: exportId },
        select: { resumeId: true },
      });

      if (!exportRecord) {
        throw new Error(`Export not found: ${exportId}`);
      }

      await prisma.resumeExport.update({
        where: { id: exportId },
        data: { downloadCount: { increment: 1 } },
      });

      // Trigger notification for download (async, non-blocking)
      NotificationService.createNotification(exportRecord.resumeId, {
        type: 'download',
        viewerEmail: undefined,
        viewerName: undefined,
      }).catch(err => {
        console.error('Failed to create download notification:', err);
      });
    } catch (error) {
      throw new Error(`Failed to record download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get analytics data for a resume
   */
  static async getAnalytics(resumeId: string): Promise<AnalyticsData> {
    try {
      // Get all views
      const views = await prisma.resumeView.findMany({
        where: { resumeId },
        orderBy: { createdAt: 'desc' },
      });

      // Get unique viewers
      const uniqueViewers = new Set(views.map(v => v.viewerEmail || v.id)).size;

      // Get recent viewers
      const recentViewers = views.slice(0, 10);

      // Get downloads
      const exports = await prisma.resumeExport.findMany({
        where: { resumeId },
      });

      const totalDownloads = exports.reduce((sum, exp) => sum + exp.downloadCount, 0);

      // Get shares
      const shareLinks = await prisma.resumeShareLink.findMany({
        where: { resumeId },
      });

      const totalShares = shareLinks.length;

      // Calculate ratios
      const totalViews = views.length;
      const downloadToViewRatio = totalViews > 0 ? totalDownloads / totalViews : 0;
      const shareToViewRatio = totalViews > 0 ? totalShares / totalViews : 0;

      // Calculate view trend (last 7 days)
      const viewTrend = this.calculateViewTrend(views);

      return {
        totalViews,
        uniqueViewers,
        viewTrend,
        recentViewers,
        downloadCount: totalDownloads,
        downloadToViewRatio,
        shareCount: totalShares,
        shareToViewRatio,
      };
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recent viewers with pagination
   */
  static async getRecentViewers(
    resumeId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ viewers: Viewer[]; total: number }> {
    try {
      const viewers = await prisma.resumeView.findMany({
        where: { resumeId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.resumeView.count({
        where: { resumeId },
      });

      return { viewers, total };
    } catch (error) {
      throw new Error(`Failed to get recent viewers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get engagement metrics per section
   */
  static async getSectionEngagement(resumeId: string): Promise<Record<string, number>> {
    try {
      // TODO: Implement section engagement tracking
      // This would require tracking time spent per section
      // For now, return empty object
      return {};
    } catch (error) {
      throw new Error(`Failed to get section engagement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if aggregation is needed and perform it
   */
  private static async checkAndAggregate(resumeId: string): Promise<void> {
    try {
      const viewCount = await prisma.resumeView.count({
        where: { resumeId },
      });

      if (viewCount > this.AGGREGATION_THRESHOLD) {
        await this.aggregateOldViews(resumeId);
      }
    } catch (error) {
      // Silently fail aggregation check
      console.error('Aggregation check failed:', error);
    }
  }

  /**
   * Aggregate views older than retention period
   */
  private static async aggregateOldViews(resumeId: string): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.HOURLY_RETENTION_DAYS);

      // TODO: Implement aggregation logic
      // This would involve:
      // 1. Grouping views by day
      // 2. Creating summary records
      // 3. Deleting detailed records
      // For now, this is a placeholder
    } catch (error) {
      console.error('Aggregation failed:', error);
    }
  }

  /**
   * Calculate view trend for last 7 days
   */
  private static calculateViewTrend(
    views: Array<{ createdAt: Date }>
  ): Array<{ date: string; count: number }> {
    const trend: Record<string, number> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trend[dateStr] = 0;
    }

    // Count views by date
    views.forEach(view => {
      const dateStr = view.createdAt.toISOString().split('T')[0];
      if (dateStr in trend) {
        trend[dateStr]++;
      }
    });

    return Object.entries(trend).map(([date, count]) => ({
      date,
      count,
    }));
  }

  /**
   * Get device type from user agent
   */
  private static getDeviceType(type?: string): string {
    if (!type) return 'desktop';
    if (type === 'mobile') return 'mobile';
    if (type === 'tablet') return 'tablet';
    return 'desktop';
  }

  /**
   * Get analytics summary
   */
  static async getAnalyticsSummary(resumeId: string): Promise<{
    totalViews: number;
    uniqueViewers: number;
    totalDownloads: number;
    totalShares: number;
  }> {
    try {
      const views = await prisma.resumeView.findMany({
        where: { resumeId },
      });

      const uniqueViewers = new Set(views.map(v => v.viewerEmail || v.id)).size;

      const exports = await prisma.resumeExport.findMany({
        where: { resumeId },
      });

      const totalDownloads = exports.reduce((sum, exp) => sum + exp.downloadCount, 0);

      const shareLinks = await prisma.resumeShareLink.findMany({
        where: { resumeId },
      });

      return {
        totalViews: views.length,
        uniqueViewers,
        totalDownloads,
        totalShares: shareLinks.length,
      };
    } catch (error) {
      throw new Error(`Failed to get analytics summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
