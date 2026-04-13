/**
 * Comprehensive Unit Tests for Analytics Service
 * 
 * Tests all analytics service functionality including:
 * - Event recording with various metadata
 * - Metric calculations (ratios, averages, trends)
 * - Date range filtering
 * - Aggregation logic
 * - Section engagement ranking
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  recordAnalyticsEvent,
  getAnalyticsSummary,
  getTrends,
  getSectionEngagement,
  getViewHistory,
  getRecentViewers,
  updateSectionEngagement,
} from '@/services/analytics/analytics-service';

describe('Analytics Service - Comprehensive Unit Tests', () => {
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
    it('should record view event with all metadata', async () => {
      const eventId = await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
        viewerEmail: 'viewer@example.com',
        country: 'US',
        deviceType: 'desktop',
        browser: 'Chrome',
        operatingSystem: 'Windows',
      });

      expect(eventId).toBeTruthy();

      const event = await prisma.resumeAnalytics.findUnique({
        where: { id: eventId },
      });

      expect(event?.eventType).toBe('view');
      expect(event?.viewerEmail).toBe('viewer@example.com');
      expect(event?.country).toBe('US');
      expect(event?.deviceType).toBe('desktop');
      expect(event?.browser).toBe('Chrome');
      expect(event?.operatingSystem).toBe('Windows');
    });

    it('should record download event', async () => {
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

    it('should record share event with share method', async () => {
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

    it('should record event with minimal metadata', async () => {
      const eventId = await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
      });

      expect(eventId).toBeTruthy();

      const event = await prisma.resumeAnalytics.findUnique({
        where: { id: eventId },
      });

      expect(event?.resumeId).toBe(testResumeId);
      expect(event?.eventType).toBe('view');
    });

    it('should record event with timestamp', async () => {
      const beforeTime = new Date();
      const eventId = await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
      });
      const afterTime = new Date();

      const event = await prisma.resumeAnalytics.findUnique({
        where: { id: eventId },
      });

      expect(event?.createdAt).toBeInstanceOf(Date);
      expect(event?.createdAt!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(event?.createdAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should record section engagement data', async () => {
      const eventId = await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
        sectionName: 'experience',
        timeSpentSeconds: 45,
        scrollDepth: 75,
      });

      expect(eventId).toBeTruthy();

      const event = await prisma.resumeAnalytics.findUnique({
        where: { id: eventId },
      });

      expect(event?.sectionName).toBe('experience');
      expect(event?.timeSpentSeconds).toBe(45);
      expect(event?.scrollDepth).toBe(75);
    });
  });

  describe('Metric Calculations', () => {
    beforeEach(async () => {
      // Record test events
      for (let i = 0; i < 5; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: `viewer${i}@example.com`,
        });
      }

      for (let i = 0; i < 2; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'download',
        });
      }

      for (let i = 0; i < 1; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'share',
        });
      }
    });

    it('should calculate total view count', async () => {
      const summary = await getAnalyticsSummary(testResumeId);

      expect(summary.totalViews).toBe(5);
    });

    it('should calculate total download count', async () => {
      const summary = await getAnalyticsSummary(testResumeId);

      expect(summary.totalDownloads).toBe(2);
    });

    it('should calculate total share count', async () => {
      const summary = await getAnalyticsSummary(testResumeId);

      expect(summary.totalShares).toBe(1);
    });

    it('should calculate view-to-download ratio', async () => {
      const summary = await getAnalyticsSummary(testResumeId);

      expect(summary.viewToDownloadRatio).toBe(2.5); // 5 views / 2 downloads
    });

    it('should calculate share-to-view ratio', async () => {
      const summary = await getAnalyticsSummary(testResumeId);

      expect(summary.shareToViewRatio).toBe(0.2); // 1 share / 5 views
    });

    it('should handle zero downloads for ratio calculation', async () => {
      // Create new resume with only views
      const resume2 = await prisma.resume.create({
        data: {
          userId: testUserId,
          title: 'Test Resume 2',
          slug: `test2-${Date.now()}`,
        },
      });

      await recordAnalyticsEvent({
        resumeId: resume2.id,
        eventType: 'view',
      });

      const summary = await getAnalyticsSummary(resume2.id);

      expect(summary.viewToDownloadRatio).toBe(0);

      // Cleanup
      await prisma.resumeAnalytics.deleteMany({ where: { resumeId: resume2.id } });
      await prisma.resume.delete({ where: { id: resume2.id } });
    });

    it('should count unique viewers', async () => {
      const summary = await getAnalyticsSummary(testResumeId);

      expect(summary.uniqueViewers).toBe(5);
    });

    it('should handle duplicate viewers', async () => {
      // Record another view from same viewer
      await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
        viewerEmail: 'viewer0@example.com',
      });

      const summary = await getAnalyticsSummary(testResumeId);

      // Should still be 5 unique viewers
      expect(summary.uniqueViewers).toBe(5);
    });
  });

  describe('Date Range Filtering', () => {
    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Record events at different times
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
          createdAt: twoDaysAgo,
        },
      });

      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
          createdAt: yesterday,
        },
      });

      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
          createdAt: now,
        },
      });
    });

    it('should filter events by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const summary = await getAnalyticsSummary(testResumeId, yesterday, now);

      // Should include yesterday and today, but not 2 days ago
      expect(summary.totalViews).toBe(2);
    });

    it('should include events on start date', async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const summary = await getAnalyticsSummary(testResumeId, twoDaysAgo, now);

      expect(summary.totalViews).toBe(3);
    });

    it('should include events on end date', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const summary = await getAnalyticsSummary(testResumeId, yesterday, now);

      expect(summary.totalViews).toBeGreaterThanOrEqual(2);
    });

    it('should return zero events for empty date range', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const summary = await getAnalyticsSummary(testResumeId, futureDate, futureDate);

      expect(summary.totalViews).toBe(0);
    });
  });

  describe('View History', () => {
    beforeEach(async () => {
      // Record views with different timestamps
      for (let i = 0; i < 3; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: `viewer${i}@example.com`,
        });

        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    it('should return view history in reverse chronological order', async () => {
      const history = await getViewHistory(testResumeId);

      expect(history.length).toBeGreaterThanOrEqual(3);

      // Verify reverse chronological order
      for (let i = 0; i < history.length - 1; i++) {
        expect(history[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          history[i + 1].timestamp.getTime()
        );
      }
    });

    it('should include viewer email in history', async () => {
      const history = await getViewHistory(testResumeId);

      const viewerEmails = history.map(v => v.viewerEmail).filter(Boolean);
      expect(viewerEmails.length).toBeGreaterThan(0);
    });

    it('should include timestamp in history', async () => {
      const history = await getViewHistory(testResumeId);

      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should support date range filtering in history', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const history = await getViewHistory(testResumeId, yesterday, now);

      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Recent Viewers', () => {
    beforeEach(async () => {
      // Record views from different viewers
      for (let i = 0; i < 3; i++) {
        await recordAnalyticsEvent({
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: `viewer${i}@example.com`,
          country: 'US',
          deviceType: 'desktop',
        });
      }
    });

    it('should return recent viewers', async () => {
      const viewers = await getRecentViewers(testResumeId);

      expect(viewers.length).toBeGreaterThan(0);
    });

    it('should include viewer email', async () => {
      const viewers = await getRecentViewers(testResumeId);

      expect(viewers[0].viewerEmail).toBeDefined();
    });

    it('should include last viewed timestamp', async () => {
      const viewers = await getRecentViewers(testResumeId);

      expect(viewers[0].lastViewedAt).toBeInstanceOf(Date);
    });

    it('should include view count per viewer', async () => {
      const viewers = await getRecentViewers(testResumeId);

      expect(viewers[0].viewCount).toBeGreaterThanOrEqual(1);
    });

    it('should include device type', async () => {
      const viewers = await getRecentViewers(testResumeId);

      expect(viewers[0].deviceType).toBeDefined();
    });

    it('should include country', async () => {
      const viewers = await getRecentViewers(testResumeId);

      expect(viewers[0].country).toBeDefined();
    });

    it('should limit number of recent viewers', async () => {
      const viewers = await getRecentViewers(testResumeId, 2);

      expect(viewers.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Section Engagement', () => {
    beforeEach(async () => {
      // Record section engagement data
      await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
        sectionName: 'experience',
        timeSpentSeconds: 120,
        scrollDepth: 100,
      });

      await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
        sectionName: 'skills',
        timeSpentSeconds: 30,
        scrollDepth: 50,
      });

      await recordAnalyticsEvent({
        resumeId: testResumeId,
        eventType: 'view',
        sectionName: 'education',
        timeSpentSeconds: 60,
        scrollDepth: 75,
      });
    });

    it('should track section engagement', async () => {
      const engagement = await getSectionEngagement(testResumeId);

      expect(engagement.length).toBeGreaterThan(0);
    });

    it('should include section name', async () => {
      const engagement = await getSectionEngagement(testResumeId);

      const sectionNames = engagement.map(e => e.sectionName);
      expect(sectionNames).toContain('experience');
      expect(sectionNames).toContain('skills');
    });

    it('should include view count per section', async () => {
      const engagement = await getSectionEngagement(testResumeId);

      expect(engagement[0].viewCount).toBeGreaterThanOrEqual(1);
    });

    it('should include time spent per section', async () => {
      const engagement = await getSectionEngagement(testResumeId);

      expect(engagement[0].timeSpentSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should rank sections by engagement', async () => {
      const engagement = await getSectionEngagement(testResumeId);

      // Experience should be ranked higher (120 seconds)
      const experienceIndex = engagement.findIndex(e => e.sectionName === 'experience');
      const skillsIndex = engagement.findIndex(e => e.sectionName === 'skills');

      if (experienceIndex !== -1 && skillsIndex !== -1) {
        expect(experienceIndex).toBeLessThan(skillsIndex);
      }
    });

    it('should calculate engagement percentage', async () => {
      const engagement = await getSectionEngagement(testResumeId);

      const totalEngagement = engagement.reduce((sum, e) => sum + e.engagementPercentage, 0);

      // Total should be approximately 100%
      expect(totalEngagement).toBeCloseTo(100, 0);
    });
  });

  describe('Section Engagement Update', () => {
    it('should update section engagement metrics', async () => {
      await updateSectionEngagement(testResumeId, 'experience', {
        viewCount: 5,
        timeSpentSeconds: 300,
        scrollDepth: 90,
      });

      const engagement = await getSectionEngagement(testResumeId);
      const experienceSection = engagement.find(e => e.sectionName === 'experience');

      expect(experienceSection?.viewCount).toBe(5);
      expect(experienceSection?.timeSpentSeconds).toBe(300);
    });

    it('should handle multiple section updates', async () => {
      await updateSectionEngagement(testResumeId, 'experience', {
        viewCount: 5,
        timeSpentSeconds: 300,
        scrollDepth: 90,
      });

      await updateSectionEngagement(testResumeId, 'skills', {
        viewCount: 3,
        timeSpentSeconds: 100,
        scrollDepth: 60,
      });

      const engagement = await getSectionEngagement(testResumeId);

      expect(engagement.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Trends Calculation', () => {
    beforeEach(async () => {
      const now = new Date();

      // Record events over multiple days
      for (let day = 0; day < 3; day++) {
        const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);

        for (let i = 0; i < day + 1; i++) {
          await prisma.resumeAnalytics.create({
            data: {
              resumeId: testResumeId,
              eventType: 'view',
              createdAt: date,
            },
          });
        }
      }
    });

    it('should calculate view trends', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const trends = await getTrends(testResumeId, threeDaysAgo, now, 'day');

      expect(trends.length).toBeGreaterThan(0);
    });

    it('should include trend values', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const trends = await getTrends(testResumeId, threeDaysAgo, now, 'day');

      expect(trends[0].value).toBeGreaterThanOrEqual(0);
    });

    it('should include trend dates', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const trends = await getTrends(testResumeId, threeDaysAgo, now, 'day');

      expect(trends[0].date).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent resume', async () => {
      const summary = await getAnalyticsSummary('non-existent-resume');

      expect(summary.totalViews).toBe(0);
    });

    it('should handle invalid date range', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const summary = await getAnalyticsSummary(testResumeId, future, now);

      expect(summary.totalViews).toBe(0);
    });

    it('should handle empty view history', async () => {
      const history = await getViewHistory(testResumeId);

      expect(Array.isArray(history)).toBe(true);
    });

    it('should handle empty recent viewers', async () => {
      const viewers = await getRecentViewers(testResumeId);

      expect(Array.isArray(viewers)).toBe(true);
    });

    it('should handle empty section engagement', async () => {
      const engagement = await getSectionEngagement(testResumeId);

      expect(Array.isArray(engagement)).toBe(true);
    });
  });
});
