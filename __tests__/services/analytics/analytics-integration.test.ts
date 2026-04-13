/**
 * Analytics Integration Tests
 * 
 * Tests the complete analytics workflow end-to-end, including:
 * - Event recording
 * - Metrics calculation
 * - Dashboard data retrieval
 * - Date range filtering
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  recordAnalyticsEvent,
  getAnalyticsSummary,
  getTrends,
  getSectionEngagement,
  getViewHistory,
  getRecentViewers,
  getAnalyticsDashboard,
} from '@/services/analytics/analytics-service';

describe('Analytics Integration Tests', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    testUserId = user.id;

    // Create test resume
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Test Resume',
        slug: `test-${Date.now()}`,
      },
    });

    testResumeId = resume.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.resumeAnalytics.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resumeSectionEngagement.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('Event Recording', () => {
    it('should record view events', async () => {
      const eventId = await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
        viewerEmail: 'viewer@example.com',
        country: 'US',
        deviceType: 'desktop',
      });

      expect(eventId).toBeTruthy();

      const event = await prisma.resumeAnalytics.findUnique({
        where: { id: eventId },
      });

      expect(event?.eventType).toBe('view');
      expect(event?.viewerEmail).toBe('viewer@example.com');
      expect(event?.country).toBe('US');
    });

    it('should record download events', async () => {
      const eventId = await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'download',
        metadata: { template: 'Modern' },
      });

      expect(eventId).toBeTruthy();

      const event = await prisma.resumeAnalytics.findUnique({
        where: { id: eventId },
      });

      expect(event?.eventType).toBe('download');
    });

    it('should record share events', async () => {
      const eventId = await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'share',
        shareMethod: 'email',
      });

      expect(eventId).toBeTruthy();

      const event = await prisma.resumeAnalytics.findUnique({
        where: { id: eventId },
      });

      expect(event?.eventType).toBe('share');
      expect(event?.shareMethod).toBe('email');
    });
  });

  describe('Metrics Calculation', () => {
    beforeEach(async () => {
      // Record test events
      for (let i = 0; i < 10; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: `viewer${i}@example.com`,
        });
      }

      for (let i = 0; i < 3; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'download',
        });
      }

      for (let i = 0; i < 2; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'share',
        });
      }
    });

    it('should calculate summary metrics correctly', async () => {
      const summary = await getAnalyticsSummary(testResumeId);

      expect(summary.totalViews).toBe(10);
      expect(summary.totalDownloads).toBe(3);
      expect(summary.totalShares).toBe(2);
      expect(summary.uniqueViewers).toBe(10);
      expect(summary.viewToDownloadRatio).toBe(0.3);
      expect(summary.shareToViewRatio).toBe(0.2);
    });

    it('should calculate trends correctly', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const trends = await getTrends(testResumeId, 'view', startDate, now, 'day');

      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0]).toHaveProperty('date');
      expect(trends[0]).toHaveProperty('value');
      expect(trends[0]).toHaveProperty('change');
    });
  });

  describe('Dashboard Data Retrieval', () => {
    beforeEach(async () => {
      // Record diverse events
      for (let i = 0; i < 5; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: `viewer${i}@example.com`,
          sectionName: 'experience',
          timeSpentSeconds: 30 + i * 10,
          scrollDepth: 50 + i * 5,
        });
      }

      for (let i = 0; i < 3; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: `viewer${i}@example.com`,
          sectionName: 'skills',
          timeSpentSeconds: 20,
          scrollDepth: 80,
        });
      }
    });

    it('should retrieve complete dashboard data', async () => {
      const dashboard = await getAnalyticsDashboard(testResumeId);

      expect(dashboard).toHaveProperty('summary');
      expect(dashboard).toHaveProperty('trends');
      expect(dashboard).toHaveProperty('sectionEngagement');
      expect(dashboard).toHaveProperty('viewHistory');
      expect(dashboard).toHaveProperty('recentViewers');
    });

    it('should retrieve view history', async () => {
      const viewHistory = await getViewHistory(testResumeId);

      expect(viewHistory.length).toBeGreaterThan(0);
      expect(viewHistory[0]).toHaveProperty('id');
      expect(viewHistory[0]).toHaveProperty('timestamp');
      expect(viewHistory[0]).toHaveProperty('viewerEmail');
    });

    it('should retrieve recent viewers', async () => {
      const recentViewers = await getRecentViewers(testResumeId);

      expect(recentViewers.length).toBeGreaterThan(0);
      expect(recentViewers[0]).toHaveProperty('viewerEmail');
      expect(recentViewers[0]).toHaveProperty('viewCount');
      expect(recentViewers[0]).toHaveProperty('lastViewedAt');
    });

    it('should retrieve section engagement', async () => {
      const sectionEngagement = await getSectionEngagement(testResumeId);

      expect(sectionEngagement.length).toBeGreaterThan(0);
      expect(sectionEngagement[0]).toHaveProperty('sectionName');
      expect(sectionEngagement[0]).toHaveProperty('viewCount');
      expect(sectionEngagement[0]).toHaveProperty('engagementPercentage');
      expect(sectionEngagement[0]).toHaveProperty('rank');
    });
  });

  describe('Date Range Filtering', () => {
    beforeEach(async () => {
      const now = new Date();

      // Record events across different dates
      for (let i = 0; i < 3; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        });
      }

      for (let i = 0; i < 5; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        });
      }

      for (let i = 0; i < 2; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          createdAt: now, // today
        });
      }
    });

    it('should filter events by date range', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const summary = await getAnalyticsSummary(testResumeId, threeDaysAgo, now);

      // Should include events from 2 days ago and today (5 + 2 = 7)
      expect(summary.totalViews).toBe(7);
    });

    it('should handle empty date ranges', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const farFutureDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

      const summary = await getAnalyticsSummary(testResumeId, futureDate, farFutureDate);

      expect(summary.totalViews).toBe(0);
    });
  });

  describe('Checkpoint Validation', () => {
    it('should pass all checkpoint requirements', async () => {
      // Requirement 1: Event recording with various metadata
      const eventId = await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
        deviceType: 'mobile',
        browser: 'Chrome',
        operatingSystem: 'iOS',
        country: 'US',
        city: 'New York',
        viewerEmail: 'test@example.com',
        viewerName: 'Test User',
      });

      expect(eventId).toBeTruthy();

      // Requirement 2: Metrics calculations are accurate
      const summary = await getAnalyticsSummary(testResumeId);
      expect(summary.totalViews).toBe(1);
      expect(summary.uniqueViewers).toBe(1);

      // Requirement 3: Date range filtering works correctly
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const filteredSummary = await getAnalyticsSummary(testResumeId, yesterday, now);
      expect(filteredSummary.totalViews).toBe(1);

      // Requirement 4: Dashboard data retrieval works
      const dashboard = await getAnalyticsDashboard(testResumeId);
      expect(dashboard.summary).toBeTruthy();
      expect(dashboard.viewHistory).toBeTruthy();
      expect(dashboard.recentViewers).toBeTruthy();
    });

    it('should handle concurrent event recording', async () => {
      // Record multiple events concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          recordAnalyticsEvent({
            resumeId: testResumeId,
            eventType: 'view',
            viewerEmail: `viewer${i}@example.com`,
          })
        );
      }

      const eventIds = await Promise.all(promises);
      expect(eventIds.length).toBe(10);
      expect(eventIds.every(id => id)).toBe(true);

      const summary = await getAnalyticsSummary(testResumeId);
      expect(summary.totalViews).toBe(10);
    });

    it('should maintain data consistency', async () => {
      // Record events
      for (let i = 0; i < 5; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
        });
      }

      // Get summary multiple times
      const summary1 = await getAnalyticsSummary(testResumeId);
      const summary2 = await getAnalyticsSummary(testResumeId);

      expect(summary1.totalViews).toBe(summary2.totalViews);
      expect(summary1.totalViews).toBe(5);
    });
  });
});
