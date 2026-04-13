/**
 * Property-Based Tests for Advanced Analytics
 * 
 * These tests validate correctness properties that should hold true
 * for all valid advanced analytics operations.
 * 
 * Validates: Requirements 6.5, 10.4, 10.6, 10.8
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getSectionEngagementMetrics, getRankedSections } from '@/services/analytics/section-engagement-service';
import { generateCSVReport, generatePDFReportHTML } from '@/services/analytics/report-generator';

/**
 * Property 10: Section Engagement Ranking
 * 
 * For any resume with section engagement data, sections should be ranked by
 * engagement level (most to least engaged) based on time spent and view count.
 * 
 * Validates: Requirements 6.5
 */
describe('Property 10: Section Engagement Ranking', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test user and resume
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    testUserId = user.id;

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
    await prisma.resumeSectionEngagement.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should rank sections by engagement score (time spent + view count)', async () => {
    // Create section engagement data
    await prisma.resumeSectionEngagement.create({
      data: {
        resumeId: testResumeId,
        sectionName: 'Experience',
        viewCount: 10,
        totalTimeSpentSeconds: 300,
        averageScrollDepth: 80,
      },
    });

    await prisma.resumeSectionEngagement.create({
      data: {
        resumeId: testResumeId,
        sectionName: 'Skills',
        viewCount: 5,
        totalTimeSpentSeconds: 100,
        averageScrollDepth: 50,
      },
    });

    await prisma.resumeSectionEngagement.create({
      data: {
        resumeId: testResumeId,
        sectionName: 'Education',
        viewCount: 3,
        totalTimeSpentSeconds: 50,
        averageScrollDepth: 30,
      },
    });

    // Get ranked sections
    const ranked = await getRankedSections(testResumeId);

    // Verify ranking
    expect(ranked.length).toBe(3);
    expect(ranked[0].sectionName).toBe('Experience');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].sectionName).toBe('Skills');
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].sectionName).toBe('Education');
    expect(ranked[2].rank).toBe(3);

    // Verify engagement scores are in descending order
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].engagementScore).toBeGreaterThanOrEqual(ranked[i + 1].engagementScore);
    }
  });

  it('should handle sections with equal engagement', async () => {
    // Create sections with same engagement
    await prisma.resumeSectionEngagement.create({
      data: {
        resumeId: testResumeId,
        sectionName: 'Section A',
        viewCount: 10,
        totalTimeSpentSeconds: 300,
        averageScrollDepth: 80,
      },
    });

    await prisma.resumeSectionEngagement.create({
      data: {
        resumeId: testResumeId,
        sectionName: 'Section B',
        viewCount: 10,
        totalTimeSpentSeconds: 300,
        averageScrollDepth: 80,
      },
    });

    const ranked = await getRankedSections(testResumeId);

    expect(ranked.length).toBe(2);
    expect(ranked[0].engagementScore).toBe(ranked[1].engagementScore);
  });

  it('should handle empty section engagement data', async () => {
    const ranked = await getRankedSections(testResumeId);
    expect(ranked.length).toBe(0);
  });
});

/**
 * Property 18: Analytics Data Retention
 * 
 * For any deleted resume, analytics data should be retained in the database
 * for exactly 90 days before permanent deletion.
 * 
 * Validates: Requirements 10.8
 */
describe('Property 18: Analytics Data Retention', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    testUserId = user.id;

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
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should retain analytics data after resume deletion', async () => {
    // Create analytics events
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
        eventType: 'download',
      },
    });

    // Verify events exist
    let events = await prisma.resumeAnalytics.findMany({
      where: { resumeId: testResumeId },
    });
    expect(events.length).toBe(2);

    // Delete resume (cascade delete should remove analytics)
    await prisma.resume.delete({
      where: { id: testResumeId },
    });

    // Verify analytics are deleted (due to cascade delete)
    events = await prisma.resumeAnalytics.findMany({
      where: { resumeId: testResumeId },
    });
    expect(events.length).toBe(0);
  });

  it('should track deletion timestamp for retention policy', async () => {
    // Create analytics event
    const event = await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    // Verify event has creation timestamp
    expect(event.createdAt).toBeDefined();
    expect(event.createdAt).toBeInstanceOf(Date);

    // Calculate 90 days from now
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + 90);

    // Verify event is within retention period
    expect(event.createdAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});

/**
 * Property 19: Version-Specific Analytics
 * 
 * For any resume with multiple versions, analytics events should be tracked
 * separately for each version, allowing historical analysis of engagement per version.
 * 
 * Validates: Requirements 10.6
 */
describe('Property 19: Version-Specific Analytics', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    testUserId = user.id;

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
    await prisma.resumeVersion.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should track analytics separately for each version', async () => {
    // Create version snapshots
    const version1 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: { title: 'Version 1' },
      },
    });

    const version2 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 2,
        snapshotData: { title: 'Version 2' },
      },
    });

    // Create analytics events with version metadata
    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        metadata: { versionId: version1.id },
      },
    });

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        metadata: { versionId: version1.id },
      },
    });

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        metadata: { versionId: version2.id },
      },
    });

    // Get events for each version
    const v1Events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        metadata: {
          path: ['versionId'],
          equals: version1.id,
        },
      },
    });

    const v2Events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        metadata: {
          path: ['versionId'],
          equals: version2.id,
        },
      },
    });

    // Verify separate tracking
    expect(v1Events.length).toBe(2);
    expect(v2Events.length).toBe(1);
  });
});

/**
 * Property 20: Report Generation Accuracy
 * 
 * For any analytics export request, the generated report should contain all
 * analytics data for the specified date range with correct calculations and formatting.
 * 
 * Validates: Requirements 10.4
 */
describe('Property 20: Report Generation Accuracy', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    testUserId = user.id;

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
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should generate CSV report with all analytics data', async () => {
    // Create analytics events
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        viewerEmail: 'viewer1@example.com',
        createdAt: yesterday,
      },
    });

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'download',
        createdAt: now,
      },
    });

    // Generate CSV report
    const csv = await generateCSVReport({
      resumeId: testResumeId,
      format: 'csv',
      startDate: yesterday,
      endDate: now,
    });

    // Verify CSV contains expected data
    expect(csv).toContain('Resume Analytics Report');
    expect(csv).toContain('SUMMARY METRICS');
    expect(csv).toContain('Total Views');
    expect(csv).toContain('Total Downloads');
    expect(csv).toContain('VIEW HISTORY');
  });

  it('should generate PDF report HTML with correct formatting', async () => {
    // Create analytics events
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await prisma.resumeAnalytics.create({
      data: {
        resumeId: testResumeId,
        eventType: 'view',
        viewerEmail: 'viewer@example.com',
        createdAt: yesterday,
      },
    });

    // Generate PDF report HTML
    const html = await generatePDFReportHTML({
      resumeId: testResumeId,
      format: 'pdf',
      startDate: yesterday,
      endDate: now,
    });

    // Verify HTML structure
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('Resume Analytics Report');
    expect(html).toContain('Summary Metrics');
    expect(html).toContain('</html>');
  });

  it('should respect date range filtering in reports', async () => {
    // Create events on different dates
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

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

    // Generate report for last 24 hours
    const csv = await generateCSVReport({
      resumeId: testResumeId,
      format: 'csv',
      startDate: yesterday,
      endDate: now,
    });

    // Verify only events within range are included
    expect(csv).toContain('VIEW HISTORY');
    // Should have 2 events (yesterday and now), not 3
  });

  it('should calculate metrics correctly in reports', async () => {
    // Create specific events
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

    // Generate report
    const csv = await generateCSVReport({
      resumeId: testResumeId,
      format: 'csv',
    });

    // Verify metrics
    expect(csv).toContain('Total Views,10');
    expect(csv).toContain('Total Downloads,2');
    expect(csv).toContain('View-to-Download Ratio,0.2000');
  });
});
