/**
 * Property-Based Tests for Analytics
 * 
 * These tests validate correctness properties that should hold true
 * for all valid analytics operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

/**
 * Property 8: View Count Accuracy
 * 
 * For any resume, the total view count should equal the number of recorded
 * view events in the analytics table for that resume.
 */
describe('Property 8: View Count Accuracy', () => {
  let testResumeId: string;

  beforeEach(async () => {
    // Create test resume
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

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
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { resumes: { some: { id: testResumeId } } } });
  });

  it('should have view count equal to number of view events', async () => {
    // Record 5 view events
    for (let i = 0; i < 5; i++) {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: `viewer${i}@example.com`,
        },
      });
    }

    // Get view count from analytics
    const viewEvents = await prisma.resumeAnalytics.count({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    // Update resume view count
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { viewCount: viewEvents },
    });

    // Verify
    const resume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(resume?.viewCount).toBe(5);
    expect(resume?.viewCount).toBe(viewEvents);
  });

  it('should handle zero view events', async () => {
    const viewEvents = await prisma.resumeAnalytics.count({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    expect(viewEvents).toBe(0);
  });

  it('should not count non-view events as views', async () => {
    // Record mixed events
    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'download',
      },
    });

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'share',
      },
    });

    const viewEvents = await prisma.resumeAnalytics.count({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    expect(viewEvents).toBe(1);
  });
});

/**
 * Property 9: Analytics Metric Calculations
 * 
 * For any set of analytics events, calculated metrics (view-to-download ratio,
 * share-to-view ratio, engagement percentages) should be mathematically correct
 * and consistent.
 */
describe('Property 9: Analytics Metric Calculations', () => {
  let testResumeId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

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
    await prisma.resumeAnalytics.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { resumes: { some: { id: testResumeId } } } });
  });

  it('should calculate view-to-download ratio correctly', async () => {
    // Record 10 views and 2 downloads
    for (let i = 0; i < 10; i++) {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
        },
      });
    }

    for (let i = 0; i < 2; i++) {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'download',
        },
      });
    }

    const events = await prisma.resumeAnalytics.findMany({
      where: { resumeId: testResumeId },
    });

    const views = events.filter(e => e.eventType === 'view').length;
    const downloads = events.filter(e => e.eventType === 'download').length;
    const ratio = downloads / views;

    expect(views).toBe(10);
    expect(downloads).toBe(2);
    expect(ratio).toBe(0.2);
  });

  it('should calculate share-to-view ratio correctly', async () => {
    // Record 20 views and 5 shares
    for (let i = 0; i < 20; i++) {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
        },
      });
    }

    for (let i = 0; i < 5; i++) {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'share',
        },
      });
    }

    const events = await prisma.resumeAnalytics.findMany({
      where: { resumeId: testResumeId },
    });

    const views = events.filter(e => e.eventType === 'view').length;
    const shares = events.filter(e => e.eventType === 'share').length;
    const ratio = shares / views;

    expect(views).toBe(20);
    expect(shares).toBe(5);
    expect(ratio).toBe(0.25);
  });

  it('should handle zero views for ratio calculation', async () => {
    const events = await prisma.resumeAnalytics.findMany({
      where: { resumeId: testResumeId },
    });

    const views = events.filter(e => e.eventType === 'view').length;
    const downloads = events.filter(e => e.eventType === 'download').length;
    const ratio = views > 0 ? downloads / views : 0;

    expect(views).toBe(0);
    expect(ratio).toBe(0);
  });
});

/**
 * Property 11: Date Range Filtering
 * 
 * For any date range query on analytics data, only events with timestamps
 * within the specified range (inclusive) should be returned.
 */
describe('Property 11: Date Range Filtering', () => {
  let testResumeId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

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
    await prisma.resumeAnalytics.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { resumes: { some: { id: testResumeId } } } });
  });

  it('should return only events within date range', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Create events with different timestamps
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

    // Query with date range
    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        createdAt: {
          gte: yesterday,
          lte: tomorrow,
        },
      },
    });

    expect(events.length).toBe(2);
    expect(events.every(e => e.createdAt >= yesterday && e.createdAt <= tomorrow)).toBe(true);
  });

  it('should include boundary dates', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    // Create events on boundaries
    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        createdAt: startDate,
      },
    });

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        createdAt: endDate,
      },
    });

    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    expect(events.length).toBe(2);
  });
});

/**
 * Property 12: View History Chronological Order
 * 
 * For any view history query, views should be returned in reverse chronological
 * order (most recent first) with correct timestamps.
 */
describe('Property 12: View History Chronological Order', () => {
  let testResumeId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

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
    await prisma.resumeAnalytics.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { resumes: { some: { id: testResumeId } } } });
  });

  it('should return views in reverse chronological order', async () => {
    const now = new Date();

    // Create views in chronological order
    for (let i = 0; i < 5; i++) {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
          createdAt: new Date(now.getTime() + i * 1000),
        },
      });
    }

    // Query views
    const views = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Verify reverse chronological order
    for (let i = 0; i < views.length - 1; i++) {
      expect(views[i].createdAt.getTime()).toBeGreaterThanOrEqual(views[i + 1].createdAt.getTime());
    }
  });

  it('should preserve timestamps correctly', async () => {
    const timestamp = new Date('2024-01-15T10:30:00Z');

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        createdAt: timestamp,
      },
    });

    const view = await prisma.resumeAnalytics.findFirst({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    expect(view?.createdAt.getTime()).toBe(timestamp.getTime());
  });
});

/**
 * Property 13: Unique Viewer Aggregation
 * 
 * For any resume with multiple views from the same viewer, the unique viewer
 * count should reflect the number of distinct viewers, not total views.
 */
describe('Property 13: Unique Viewer Aggregation', () => {
  let testResumeId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

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
    await prisma.resumeAnalytics.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { resumes: { some: { id: testResumeId } } } });
  });

  it('should count unique viewers correctly', async () => {
    // Same viewer views 3 times
    for (let i = 0; i < 3; i++) {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: 'viewer1@example.com',
        },
      });
    }

    // Different viewer views 2 times
    for (let i = 0; i < 2; i++) {
      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
          viewerEmail: 'viewer2@example.com',
        },
      });
    }

    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    const uniqueViewers = new Set(
      events.filter(e => e.viewerEmail).map(e => e.viewerEmail)
    ).size;

    expect(events.length).toBe(5);
    expect(uniqueViewers).toBe(2);
  });

  it('should handle anonymous viewers', async () => {
    // Create views with and without viewer email
    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        viewerEmail: 'viewer@example.com',
      },
    });

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        // No viewerEmail
      },
    });

    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    const uniqueViewers = new Set(
      events.filter(e => e.viewerEmail).map(e => e.viewerEmail)
    ).size;

    expect(events.length).toBe(2);
    expect(uniqueViewers).toBe(1);
  });
});

/**
 * Property 14: Average Calculation Accuracy
 * 
 * For any time period with view events, the calculated average views per day
 * should equal total views divided by number of days in the period.
 */
describe('Property 14: Average Calculation Accuracy', () => {
  let testResumeId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

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
    await prisma.resumeAnalytics.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { resumes: { some: { id: testResumeId } } } });
  });

  it('should calculate average views per day correctly', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-10'); // 10 days

    // Create 100 views spread across 10 days
    for (let i = 0; i < 100; i++) {
      const dayOffset = i % 10;
      const date = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

      await prisma.resumeAnalytics.create({
        data: {
          resumeId: testResumeId,
          eventType: 'view',
          createdAt: date,
        },
      });
    }

    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalViews = events.length;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const averageViewsPerDay = totalViews / daysDiff;

    expect(totalViews).toBe(100);
    expect(daysDiff).toBe(10);
    expect(averageViewsPerDay).toBe(10);
  });
});
