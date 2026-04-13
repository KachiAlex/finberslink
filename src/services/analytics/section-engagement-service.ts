/**
 * Section Engagement Service
 * 
 * Handles tracking section access, time spent, scroll depth, and engagement metrics.
 * Provides section ranking by engagement level.
 */

import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

const logger = new Logger('SectionEngagementService');

export interface SectionEngagementData {
  sectionName: string;
  timeSpentSeconds: number;
  scrollDepth: number; // 0-100 percentage
}

export interface SectionEngagementMetrics {
  sectionName: string;
  viewCount: number;
  totalTimeSpentSeconds: number;
  averageTimeSpentSeconds: number;
  averageScrollDepth: number;
  engagementScore: number; // 0-100
  rank: number;
}

/**
 * Track section engagement for a resume view
 */
export async function trackSectionEngagement(
  resumeId: string,
  sections: SectionEngagementData[]
): Promise<void> {
  try {
    for (const section of sections) {
      await prisma.resumeSectionEngagement.upsert({
        where: {
          resumeId_sectionName: {
            resumeId,
            sectionName: section.sectionName,
          },
        },
        update: {
          viewCount: {
            increment: 1,
          },
          totalTimeSpentSeconds: {
            increment: section.timeSpentSeconds,
          },
          averageScrollDepth: {
            increment: section.scrollDepth,
          },
          lastUpdatedAt: new Date(),
        },
        create: {
          resumeId,
          sectionName: section.sectionName,
          viewCount: 1,
          totalTimeSpentSeconds: section.timeSpentSeconds,
          averageScrollDepth: section.scrollDepth,
        },
      });
    }

    logger.info(`Section engagement tracked for resume ${resumeId}: ${sections.length} sections`);
  } catch (error) {
    logger.error('Error tracking section engagement', error);
    throw error;
  }
}

/**
 * Get section engagement metrics for a resume, ranked by engagement level
 */
export async function getSectionEngagementMetrics(
  resumeId: string
): Promise<SectionEngagementMetrics[]> {
  try {
    const sections = await prisma.resumeSectionEngagement.findMany({
      where: { resumeId },
    });

    if (sections.length === 0) {
      return [];
    }

    // Calculate engagement scores and sort by engagement level
    const metrics = sections.map(section => {
      // Engagement score combines view count and time spent
      // Normalized to 0-100 scale
      const timeScore = Math.min(section.totalTimeSpentSeconds / 10, 50); // Max 50 points for time
      const viewScore = Math.min(section.viewCount * 5, 50); // Max 50 points for views
      const engagementScore = Math.round(timeScore + viewScore);

      return {
        sectionName: section.sectionName,
        viewCount: section.viewCount,
        totalTimeSpentSeconds: section.totalTimeSpentSeconds,
        averageTimeSpentSeconds:
          section.viewCount > 0
            ? Math.round(section.totalTimeSpentSeconds / section.viewCount)
            : 0,
        averageScrollDepth:
          section.viewCount > 0
            ? Math.round(section.averageScrollDepth / section.viewCount)
            : 0,
        engagementScore: Math.min(engagementScore, 100),
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by engagement score (descending) and assign ranks
    metrics.sort((a, b) => b.engagementScore - a.engagementScore);
    metrics.forEach((metric, index) => {
      metric.rank = index + 1;
    });

    return metrics;
  } catch (error) {
    logger.error('Error getting section engagement metrics', error);
    throw error;
  }
}

/**
 * Get ranked sections by engagement level (alias for getSectionEngagementMetrics)
 */
export async function getRankedSections(
  resumeId: string
): Promise<SectionEngagementMetrics[]> {
  return getSectionEngagementMetrics(resumeId);
}

/**
 * Get top engaged sections for a resume
 */
export async function getTopEngagedSections(
  resumeId: string,
  limit: number = 5
): Promise<SectionEngagementMetrics[]> {
  try {
    const metrics = await getSectionEngagementMetrics(resumeId);
    return metrics.slice(0, limit);
  } catch (error) {
    logger.error('Error getting top engaged sections', error);
    throw error;
  }
}

/**
 * Get section engagement percentage distribution
 */
export async function getSectionEngagementPercentages(
  resumeId: string
): Promise<Map<string, number>> {
  try {
    const metrics = await getSectionEngagementMetrics(resumeId);

    const totalEngagement = metrics.reduce((sum, m) => sum + m.engagementScore, 0);

    const percentages = new Map<string, number>();
    metrics.forEach(metric => {
      const percentage =
        totalEngagement > 0 ? (metric.engagementScore / totalEngagement) * 100 : 0;
      percentages.set(metric.sectionName, Math.round(percentage * 100) / 100);
    });

    return percentages;
  } catch (error) {
    logger.error('Error getting section engagement percentages', error);
    throw error;
  }
}

/**
 * Reset section engagement data for a resume
 */
export async function resetSectionEngagement(resumeId: string): Promise<void> {
  try {
    await prisma.resumeSectionEngagement.deleteMany({
      where: { resumeId },
    });

    logger.info(`Section engagement reset for resume ${resumeId}`);
  } catch (error) {
    logger.error('Error resetting section engagement', error);
    throw error;
  }
}

/**
 * Get section engagement comparison between two time periods
 */
export async function compareSectionEngagement(
  resumeId: string,
  startDate1: Date,
  endDate1: Date,
  startDate2: Date,
  endDate2: Date
): Promise<Map<string, { period1: number; period2: number; change: number }>> {
  try {
    // Get events for both periods
    const events1 = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId,
        eventType: 'view',
        createdAt: {
          gte: startDate1,
          lte: endDate1,
        },
      },
    });

    const events2 = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId,
        eventType: 'view',
        createdAt: {
          gte: startDate2,
          lte: endDate2,
        },
      },
    });

    // Aggregate by section
    const sectionMap = new Map<string, { period1: number; period2: number; change: number }>();

    // Process period 1
    events1.forEach(event => {
      if (event.sectionName) {
        const current = sectionMap.get(event.sectionName) || { period1: 0, period2: 0, change: 0 };
        current.period1 += 1;
        sectionMap.set(event.sectionName, current);
      }
    });

    // Process period 2
    events2.forEach(event => {
      if (event.sectionName) {
        const current = sectionMap.get(event.sectionName) || { period1: 0, period2: 0, change: 0 };
        current.period2 += 1;
        sectionMap.set(event.sectionName, current);
      }
    });

    // Calculate change percentages
    sectionMap.forEach(data => {
      if (data.period1 > 0) {
        data.change = ((data.period2 - data.period1) / data.period1) * 100;
      } else if (data.period2 > 0) {
        data.change = 100;
      }
    });

    return sectionMap;
  } catch (error) {
    logger.error('Error comparing section engagement', error);
    throw error;
  }
}
