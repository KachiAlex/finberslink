/**
 * Comprehensive Unit Tests for Analytics Service
 * 
 * Tests all analytics service functionality including:
 * - Event recording and persistence
 * - Metric calculations (ratios, averages, trends)
 * - Date range filtering
 * - Aggregation logic
 * - Section engagement tracking
 * - View history and viewer tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordAnalyticsEvent,
  getAnalyticsSummary,
  getTrends,
  getSectionEngagement,
  getViewHistory,
  getRecentViewers,
  getAnalyticsDashboard,
  updateSectionEngagement,
  deleteAnalyticsData,
} from '@/services/analytics/analytics-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    resumeAnalytics: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    resumeSectionEngagement: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('Analytics Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Event Recording', () => {
    it('should record view event successfully', async () => {
      const mockId = 'event-123';
      (prisma.resumeAnalytics.create as any).mockResolvedValueOnce({ id: mockId });

      const eventId = await recordAnalyticsEvent({
        resumeId: 'resume-123',
        eventType: 'view',
        country: 'US',
        browser: 'Chrome',
      });

      expect(eventId).toBe(mockId);
      expect(prisma.resumeAnalytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resumeId: 'resume-123',
          eventType: 'view',
          country: 'US',
          browser: 'Chrome',
        }),
      });
    });

    it('should record download event with metadata', async () => {
      (prisma.resumeAnalytics.create as any).mockResolvedValueOnce({ id: 'event-456' });

      await recordAnalyticsEvent({
        resumeId: 'resume-456',
        eventType: 'download',
        deviceType: 'mobile',
        metadata: { template: 'Modern' },
      });

      expect(prisma.resumeAnalytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'download',
          deviceType: 'mobile',
          metadata: { template: 'Modern' },
        }),
      });
    });

    it('should record share event with share method', async () => {
      (prisma.resumeAnalytics.create as any).mockResolvedValueOnce({ id: 'event-789' });

      await recordAnalyticsEvent({
        resumeId: 'resume-789',
        eventType: 'share',
        shareMethod: 'email',
      });

      expect(prisma.resumeAnalytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'share',
          shareMethod: 'email',
        }),
      });
    });

    it('should record export event', async () => {
      (prisma.resumeAnalytics.create as any).mockResolvedValueOnce({ id: 'event-export' });

      await recordAnalyticsEvent({
        resumeId: 'resume-export',
        eventType: 'export',
        metadata: { template: 'Classic' },
      });

      expect(prisma.resumeAnalytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'export',
        }),
      });
    });

    it('should handle event recording errors', async () => {
      (prisma.resumeAnalytics.create as any).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        recordAnalyticsEvent({
          resumeId: 'resume-123',
          eventType: 'view',
        })
      ).rejects.toThrow('DB error');
    });
  });

  describe('Analytics Summary Calculations', () => {
    it('should calculate summary metrics correctly', async () => {
      const mockEvents = [
        { eventType: 'view', viewerEmail: 'user1@example.com', createdAt: new Date() },
        { eventType: 'view', viewerEmail: 'user2@example.com', createdAt: new Date() },
        { eventType: 'view', viewerEmail: 'user1@example.com', createdAt: new Date() },
        { eventType: 'download', createdAt: new Date() },
        { eventType: 'share', createdAt: new Date() },
        { eventType: 'export', createdAt: new Date() },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const summary = await getAnalyticsSummary('resume-123');

      expect(summary.totalViews).toBe(3);
      expect(summary.totalDownloads).toBe(1);
      expect(summary.totalShares).toBe(1);
      expect(summary.totalExports).toBe(1);
      expect(summary.uniqueViewers).toBe(2);
    });

    it('should calculate view-to-download ratio', async () => {
      const mockEvents = [
        { eventType: 'view', createdAt: new Date() },
        { eventType: 'view', createdAt: new Date() },
        { eventType: 'view', createdAt: new Date() },
        { eventType: 'view', createdAt: new Date() },
        { eventType: 'download', createdAt: new Date() },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const summary = await getAnalyticsSummary('resume-123');

      expect(summary.viewToDownloadRatio).toBe(0.25); // 1 download / 4 views
    });

    it('should calculate share-to-view ratio', async () => {
      const mockEvents = [
        { eventType: 'view', createdAt: new Date() },
        { eventType: 'view', createdAt: new Date() },
        { eventType: 'share', createdAt: new Date() },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const summary = await getAnalyticsSummary('resume-123');

      expect(summary.shareToViewRatio).toBeCloseTo(0.5, 1); // 1 share / 2 views
    });

    it('should handle zero views gracefully', async () => {
      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce([]);

      const summary = await getAnalyticsSummary('resume-123');

      expect(summary.totalViews).toBe(0);
      expect(summary.viewToDownloadRatio).toBe(0);
      expect(summary.shareToViewRatio).toBe(0);
    });

    it('should filter events by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await getAnalyticsSummary('resume-123', startDate, endDate);

      expect(prisma.resumeAnalytics.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          resumeId: 'resume-123',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
      });
    });
  });

  describe('Trend Calculations', () => {
    it('should calculate daily trends', async () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const date3 = new Date('2024-01-03');

      const mockEvents = [
        { eventType: 'view', createdAt: date1 },
        { eventType: 'view', createdAt: date1 },
        { eventType: 'view', createdAt: date2 },
        { eventType: 'view', createdAt: date3 },
        { eventType: 'view', createdAt: date3 },
        { eventType: 'view', createdAt: date3 },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const trends = await getTrends(
        'resume-123',
        'view',
        new Date('2024-01-01'),
        new Date('2024-01-03'),
        'day'
      );

      expect(trends).toHaveLength(3);
      expect(trends[0].value).toBe(2); // Jan 1: 2 views
      expect(trends[1].value).toBe(1); // Jan 2: 1 view
      expect(trends[2].value).toBe(3); // Jan 3: 3 views
    });

    it('should calculate percentage change in trends', async () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');

      const mockEvents = [
        { eventType: 'view', createdAt: date1 },
        { eventType: 'view', createdAt: date1 },
        { eventType: 'view', createdAt: date2 },
        { eventType: 'view', createdAt: date2 },
        { eventType: 'view', createdAt: date2 },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const trends = await getTrends(
        'resume-123',
        'view',
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        'day'
      );

      expect(trends[0].change).toBe(0); // First day has no previous value
      expect(trends[1].change).toBe(50); // 3 views vs 2 views = 50% increase
    });

    it('should group events by week', async () => {
      const date1 = new Date('2024-01-01'); // Monday
      const date8 = new Date('2024-01-08'); // Next Monday

      const mockEvents = [
        { eventType: 'view', createdAt: date1 },
        { eventType: 'view', createdAt: date1 },
        { eventType: 'view', createdAt: date8 },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const trends = await getTrends(
        'resume-123',
        'view',
        date1,
        date8,
        'week'
      );

      expect(trends.length).toBeGreaterThanOrEqual(1);
    });

    it('should group events by month', async () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-02-15');

      const mockEvents = [
        { eventType: 'view', createdAt: date1 },
        { eventType: 'view', createdAt: date2 },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const trends = await getTrends(
        'resume-123',
        'view',
        date1,
        date2,
        'month'
      );

      expect(trends.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Section Engagement', () => {
    it('should retrieve section engagement data', async () => {
      const mockSections = [
        {
          sectionName: 'experience',
          viewCount: 100,
          totalTimeSpentSeconds: 300,
          averageScrollDepth: 80,
        },
        {
          sectionName: 'skills',
          viewCount: 50,
          totalTimeSpentSeconds: 100,
          averageScrollDepth: 60,
        },
      ];

      (prisma.resumeSectionEngagement.findMany as any).mockResolvedValueOnce(mockSections);

      const engagement = await getSectionEngagement('resume-123');

      expect(engagement).toHaveLength(2);
      expect(engagement[0].sectionName).toBe('experience');
      expect(engagement[0].rank).toBe(1);
      expect(engagement[1].rank).toBe(2);
    });

    it('should calculate engagement percentages', async () => {
      const mockSections = [
        {
          sectionName: 'experience',
          viewCount: 100,
          totalTimeSpentSeconds: 300,
          averageScrollDepth: 80,
        },
        {
          sectionName: 'skills',
          viewCount: 50,
          totalTimeSpentSeconds: 100,
          averageScrollDepth: 60,
        },
      ];

      (prisma.resumeSectionEngagement.findMany as any).mockResolvedValueOnce(mockSections);

      const engagement = await getSectionEngagement('resume-123');

      const totalTime = 300 + 100;
      expect(engagement[0].engagementPercentage).toBe((300 / totalTime) * 100);
      expect(engagement[1].engagementPercentage).toBe((100 / totalTime) * 100);
    });

    it('should rank sections by engagement', async () => {
      const mockSections = [
        {
          sectionName: 'experience',
          viewCount: 100,
          totalTimeSpentSeconds: 300,
          averageScrollDepth: 80,
        },
        {
          sectionName: 'education',
          viewCount: 80,
          totalTimeSpentSeconds: 200,
          averageScrollDepth: 70,
        },
        {
          sectionName: 'skills',
          viewCount: 50,
          totalTimeSpentSeconds: 100,
          averageScrollDepth: 60,
        },
      ];

      (prisma.resumeSectionEngagement.findMany as any).mockResolvedValueOnce(mockSections);

      const engagement = await getSectionEngagement('resume-123');

      expect(engagement[0].rank).toBe(1);
      expect(engagement[1].rank).toBe(2);
      expect(engagement[2].rank).toBe(3);
    });

    it('should update section engagement', async () => {
      (prisma.resumeSectionEngagement.findUnique as any).mockResolvedValueOnce({
        averageScrollDepth: 50,
      });

      (prisma.resumeSectionEngagement.upsert as any).mockResolvedValueOnce({});

      await updateSectionEngagement('resume-123', 'experience', 120, 75);

      expect(prisma.resumeSectionEngagement.upsert).toHaveBeenCalled();
    });
  });

  describe('View History', () => {
    it('should retrieve view history in reverse chronological order', async () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const date3 = new Date('2024-01-03');

      const mockViews = [
        { id: '1', eventType: 'view', createdAt: date3, deviceType: 'desktop' },
        { id: '2', eventType: 'view', createdAt: date2, deviceType: 'mobile' },
        { id: '3', eventType: 'view', createdAt: date1, deviceType: 'tablet' },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockViews);

      const history = await getViewHistory('resume-123');

      expect(history).toHaveLength(3);
      expect(history[0].id).toBe('1'); // Most recent first
      expect(history[1].id).toBe('2');
      expect(history[2].id).toBe('3');
    });

    it('should include view metadata', async () => {
      const mockViews = [
        {
          id: '1',
          eventType: 'view',
          createdAt: new Date(),
          deviceType: 'mobile',
          browser: 'Chrome',
          operatingSystem: 'iOS',
          country: 'US',
          city: 'New York',
          timeSpentSeconds: 120,
          viewerEmail: 'user@example.com',
        },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockViews);

      const history = await getViewHistory('resume-123');

      expect(history[0].deviceType).toBe('mobile');
      expect(history[0].browser).toBe('Chrome');
      expect(history[0].country).toBe('US');
      expect(history[0].timeSpentSeconds).toBe(120);
    });

    it('should support pagination', async () => {
      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce([]);

      await getViewHistory('resume-123', 25, 50);

      expect(prisma.resumeAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 50,
        })
      );
    });
  });

  describe('Recent Viewers', () => {
    it('should retrieve recent viewers with view counts', async () => {
      const mockViewers = [
        {
          id: '1',
          eventType: 'view',
          createdAt: new Date(),
          viewerEmail: 'user1@example.com',
          viewerName: 'User One',
          deviceType: 'desktop',
          country: 'US',
        },
        {
          id: '2',
          eventType: 'view',
          createdAt: new Date(),
          viewerEmail: 'user2@example.com',
          viewerName: 'User Two',
          deviceType: 'mobile',
          country: 'UK',
        },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockViewers);
      (prisma.resumeAnalytics.count as any)
        .mockResolvedValueOnce(3) // user1 has 3 views
        .mockResolvedValueOnce(1); // user2 has 1 view

      const viewers = await getRecentViewers('resume-123');

      expect(viewers).toHaveLength(2);
      expect(viewers[0].viewerEmail).toBe('user1@example.com');
      expect(viewers[0].viewCount).toBe(3);
    });

    it('should include viewer metadata', async () => {
      const mockViewers = [
        {
          id: '1',
          eventType: 'view',
          createdAt: new Date(),
          viewerEmail: 'user@example.com',
          viewerName: 'John Doe',
          deviceType: 'mobile',
          country: 'US',
        },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockViewers);
      (prisma.resumeAnalytics.count as any).mockResolvedValueOnce(5);

      const viewers = await getRecentViewers('resume-123');

      expect(viewers[0].viewerName).toBe('John Doe');
      expect(viewers[0].deviceType).toBe('mobile');
      expect(viewers[0].country).toBe('US');
    });
  });

  describe('Analytics Dashboard', () => {
    it('should retrieve complete dashboard data', async () => {
      (prisma.resumeAnalytics.findMany as any)
        .mockResolvedValueOnce([]) // summary
        .mockResolvedValueOnce([]) // view trends
        .mockResolvedValueOnce([]) // download trends
        .mockResolvedValueOnce([]) // share trends
        .mockResolvedValueOnce([]) // export trends
        .mockResolvedValueOnce([]); // view history

      (prisma.resumeSectionEngagement.findMany as any).mockResolvedValueOnce([]);

      const dashboard = await getAnalyticsDashboard('resume-123');

      expect(dashboard).toHaveProperty('summary');
      expect(dashboard).toHaveProperty('trends');
      expect(dashboard).toHaveProperty('sectionEngagement');
      expect(dashboard).toHaveProperty('viewHistory');
      expect(dashboard).toHaveProperty('recentViewers');
    });

    it('should use default date range if not provided', async () => {
      (prisma.resumeAnalytics.findMany as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      (prisma.resumeSectionEngagement.findMany as any).mockResolvedValueOnce([]);

      await getAnalyticsDashboard('resume-123');

      // Should be called with date range (last 30 days)
      expect(prisma.resumeAnalytics.findMany).toHaveBeenCalled();
    });

    it('should support custom date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prisma.resumeAnalytics.findMany as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      (prisma.resumeSectionEngagement.findMany as any).mockResolvedValueOnce([]);

      await getAnalyticsDashboard('resume-123', startDate, endDate);

      expect(prisma.resumeAnalytics.findMany).toHaveBeenCalled();
    });
  });

  describe('Data Deletion', () => {
    it('should delete all analytics data for a resume', async () => {
      (prisma.resumeAnalytics.deleteMany as any).mockResolvedValueOnce({ count: 100 });
      (prisma.resumeSectionEngagement.deleteMany as any).mockResolvedValueOnce({ count: 5 });

      await deleteAnalyticsData('resume-123');

      expect(prisma.resumeAnalytics.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: 'resume-123' },
      });

      expect(prisma.resumeSectionEngagement.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: 'resume-123' },
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty event list', async () => {
      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce([]);

      const summary = await getAnalyticsSummary('resume-123');

      expect(summary.totalViews).toBe(0);
      expect(summary.uniqueViewers).toBe(0);
    });

    it('should handle null metadata fields', async () => {
      const mockEvents = [
        {
          eventType: 'view',
          viewerEmail: null,
          deviceType: null,
          country: null,
          createdAt: new Date(),
        },
      ];

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const summary = await getAnalyticsSummary('resume-123');

      expect(summary.totalViews).toBe(1);
      expect(summary.uniqueViewers).toBe(0); // No email, so not counted
    });

    it('should handle very large view counts', async () => {
      const mockEvents = Array.from({ length: 10000 }, () => ({
        eventType: 'view',
        viewerEmail: 'user@example.com',
        createdAt: new Date(),
      }));

      (prisma.resumeAnalytics.findMany as any).mockResolvedValueOnce(mockEvents);

      const summary = await getAnalyticsSummary('resume-123');

      expect(summary.totalViews).toBe(10000);
    });
  });
});
