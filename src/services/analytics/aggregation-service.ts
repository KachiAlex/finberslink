/**
 * Analytics Aggregation Service
 * 
 * Handles calculation and aggregation of analytics metrics
 */

import { Logger } from '@/lib/logger';
import { analyticsService } from './analytics-service';

const logger = new Logger('AggregationService');

export interface AggregatedMetrics {
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  exportCount: number;
  uniqueViewers: number;
  viewToDownloadRatio: number;
  shareToViewRatio: number;
  averageTimeSpent: number;
  engagementPercentage: number;
}

export interface TrendMetrics {
  date: string;
  views: number;
  downloads: number;
  shares: number;
  exports: number;
  viewChange: number;
  downloadChange: number;
  shareChange: number;
}

export interface ComparisonMetrics {
  period1: {
    startDate: string;
    endDate: string;
    metrics: AggregatedMetrics;
  };
  period2: {
    startDate: string;
    endDate: string;
    metrics: AggregatedMetrics;
  };
  comparison: {
    viewGrowth: number;
    downloadGrowth: number;
    shareGrowth: number;
    engagementGrowth: number;
  };
}

export class AggregationService {
  /**
   * Calculate aggregated metrics for a resume
   */
  async calculateMetrics(resumeId: string): Promise<AggregatedMetrics> {
    try {
      const summary = await analyticsService.getSummary(resumeId);
      const sectionEngagement = await analyticsService.getSectionEngagement(resumeId);

      // Calculate engagement percentage
      const totalTimeSpent = sectionEngagement.reduce(
        (sum, s) => sum + s.timeSpentSeconds,
        0
      );
      const engagementPercentage =
        summary.totalViews > 0
          ? (totalTimeSpent / (summary.totalViews * 60)) * 100
          : 0;

      return {
        viewCount: summary.totalViews,
        downloadCount: summary.totalDownloads,
        shareCount: summary.totalShares,
        exportCount: summary.totalExports,
        uniqueViewers: summary.uniqueViewers,
        viewToDownloadRatio: summary.viewToDownloadRatio,
        shareToViewRatio: summary.shareToViewRatio,
        averageTimeSpent: summary.averageTimeSpent,
        engagementPercentage: Math.min(engagementPercentage, 100),
      };
    } catch (error) {
      logger.error('Error calculating metrics', error);
      throw new Error('Failed to calculate metrics');
    }
  }

  /**
   * Calculate trend metrics for a date range
   */
  async calculateTrends(
    resumeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TrendMetrics[]> {
    try {
      const [viewTrends, downloadTrends, shareTrends] = await Promise.all([
        analyticsService.getViewTrends(resumeId, startDate, endDate, 'day'),
        analyticsService.getDownloadTrends(resumeId, startDate, endDate, 'day'),
        analyticsService.getShareTrends(resumeId, startDate, endDate, 'day'),
      ]);

      // Merge trends by date
      const dateMap = new Map<string, TrendMetrics>();

      viewTrends.forEach(trend => {
        dateMap.set(trend.date, {
          date: trend.date,
          views: trend.value,
          downloads: 0,
          shares: 0,
          exports: 0,
          viewChange: trend.change,
          downloadChange: 0,
          shareChange: 0,
        });
      });

      downloadTrends.forEach(trend => {
        const existing = dateMap.get(trend.date) || {
          date: trend.date,
          views: 0,
          downloads: 0,
          shares: 0,
          exports: 0,
          viewChange: 0,
          downloadChange: 0,
          shareChange: 0,
        };
        existing.downloads = trend.value;
        existing.downloadChange = trend.change;
        dateMap.set(trend.date, existing);
      });

      shareTrends.forEach(trend => {
        const existing = dateMap.get(trend.date) || {
          date: trend.date,
          views: 0,
          downloads: 0,
          shares: 0,
          exports: 0,
          viewChange: 0,
          downloadChange: 0,
          shareChange: 0,
        };
        existing.shares = trend.value;
        existing.shareChange = trend.change;
        dateMap.set(trend.date, existing);
      });

      return Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    } catch (error) {
      logger.error('Error calculating trends', error);
      throw new Error('Failed to calculate trends');
    }
  }

  /**
   * Compare metrics between two time periods
   */
  async compareMetrics(
    resumeId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): Promise<ComparisonMetrics> {
    try {
      // Get metrics for both periods
      const period1Metrics = await this.calculateMetrics(resumeId);
      const period2Metrics = await this.calculateMetrics(resumeId);

      // Calculate growth percentages
      const viewGrowth =
        period1Metrics.viewCount > 0
          ? ((period2Metrics.viewCount - period1Metrics.viewCount) /
              period1Metrics.viewCount) *
            100
          : 0;

      const downloadGrowth =
        period1Metrics.downloadCount > 0
          ? ((period2Metrics.downloadCount - period1Metrics.downloadCount) /
              period1Metrics.downloadCount) *
            100
          : 0;

      const shareGrowth =
        period1Metrics.shareCount > 0
          ? ((period2Metrics.shareCount - period1Metrics.shareCount) /
              period1Metrics.shareCount) *
            100
          : 0;

      const engagementGrowth =
        period1Metrics.engagementPercentage > 0
          ? ((period2Metrics.engagementPercentage -
              period1Metrics.engagementPercentage) /
              period1Metrics.engagementPercentage) *
            100
          : 0;

      return {
        period1: {
          startDate: period1Start.toISOString(),
          endDate: period1End.toISOString(),
          metrics: period1Metrics,
        },
        period2: {
          startDate: period2Start.toISOString(),
          endDate: period2End.toISOString(),
          metrics: period2Metrics,
        },
        comparison: {
          viewGrowth,
          downloadGrowth,
          shareGrowth,
          engagementGrowth,
        },
      };
    } catch (error) {
      logger.error('Error comparing metrics', error);
      throw new Error('Failed to compare metrics');
    }
  }

  /**
   * Calculate average metrics per day
   */
  async calculateAveragePerDay(
    resumeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    averageViewsPerDay: number;
    averageDownloadsPerDay: number;
    averageSharesPerDay: number;
    averageExportsPerDay: number;
  }> {
    try {
      const metrics = await this.calculateMetrics(resumeId);

      // Calculate number of days
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const days = Math.max(daysDiff, 1);

      return {
        averageViewsPerDay: metrics.viewCount / days,
        averageDownloadsPerDay: metrics.downloadCount / days,
        averageSharesPerDay: metrics.shareCount / days,
        averageExportsPerDay: metrics.exportCount / days,
      };
    } catch (error) {
      logger.error('Error calculating average per day', error);
      throw new Error('Failed to calculate average per day');
    }
  }

  /**
   * Get engagement score (0-100)
   */
  async getEngagementScore(resumeId: string): Promise<number> {
    try {
      const metrics = await this.calculateMetrics(resumeId);

      // Calculate engagement score based on multiple factors
      const viewScore = Math.min(metrics.viewCount / 100, 1) * 30; // 30 points for views
      const downloadScore = Math.min(metrics.downloadCount / 10, 1) * 30; // 30 points for downloads
      const shareScore = Math.min(metrics.shareCount / 5, 1) * 20; // 20 points for shares
      const engagementScore = Math.min(metrics.engagementPercentage / 100, 1) * 20; // 20 points for engagement

      const totalScore = viewScore + downloadScore + shareScore + engagementScore;
      return Math.round(totalScore);
    } catch (error) {
      logger.error('Error calculating engagement score', error);
      throw new Error('Failed to calculate engagement score');
    }
  }

  /**
   * Get performance rating
   */
  async getPerformanceRating(resumeId: string): Promise<{
    rating: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    recommendations: string[];
  }> {
    try {
      const score = await this.getEngagementScore(resumeId);
      const metrics = await this.calculateMetrics(resumeId);
      const recommendations: string[] = [];

      let rating: 'excellent' | 'good' | 'fair' | 'poor';

      if (score >= 80) {
        rating = 'excellent';
      } else if (score >= 60) {
        rating = 'good';
      } else if (score >= 40) {
        rating = 'fair';
      } else {
        rating = 'poor';
      }

      // Generate recommendations
      if (metrics.viewCount < 10) {
        recommendations.push('Share your resume more widely to increase views');
      }

      if (metrics.viewToDownloadRatio < 0.1) {
        recommendations.push('Improve your resume content to increase download rate');
      }

      if (metrics.shareToViewRatio < 0.05) {
        recommendations.push('Make your resume more shareable and compelling');
      }

      if (metrics.averageTimeSpent < 30) {
        recommendations.push('Add more compelling content to increase engagement time');
      }

      return {
        rating,
        score,
        recommendations,
      };
    } catch (error) {
      logger.error('Error calculating performance rating', error);
      throw new Error('Failed to calculate performance rating');
    }
  }
}

// Export singleton instance
export const aggregationService = new AggregationService();
