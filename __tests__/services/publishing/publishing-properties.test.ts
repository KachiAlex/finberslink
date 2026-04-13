/**
 * Property-Based Tests for Publishing
 * 
 * These tests validate correctness properties that should hold true
 * for all valid publishing operations.
 * 
 * **Validates: Requirements 4.2, 4.5, 4.6, 4.7, 4.8, 5.1**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  publishResume,
  unpublishResume,
  getPublicationStatus,
  getPublishedResume,
  recordPublicResumeView,
  generatePublicId,
} from '@/services/publishing/publishing-service';

/**
 * Property 15: Public URL Generation
 * 
 * For any published resume, a unique public URL should be generated in the
 * format `/public/resumes/{publicId}` where publicId is a unique identifier.
 * 
 * **Validates: Requirements 4.2**
 */
describe('Property 15: Public URL Generation', () => {
  let testUserId: string;
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
    await prisma.resumePublishing.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should generate public URL in correct format', async () => {
    const result = await publishResume(testResumeId, testUserId);

    expect(result.published).toBe(true);
    expect(result.publicUrl).toBeDefined();
    expect(result.publicUrl).toMatch(/^\/public\/resumes\/[a-f0-9\-]+$/);
  });

  it('should generate unique public IDs for different resumes', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test2-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test2',
        lastName: 'User2',
      },
    });

    const resume2 = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Test Resume 2',
        slug: `test2-${Date.now()}`,
      },
    });

    const result1 = await publishResume(testResumeId, testUserId);
    const result2 = await publishResume(resume2.id, user.id);

    expect(result1.publicId).not.toBe(result2.publicId);
    expect(result1.publicUrl).not.toBe(result2.publicUrl);

    // Cleanup
    await prisma.resumePublishing.deleteMany({ where: { resumeId: resume2.id } });
    await prisma.resume.deleteMany({ where: { id: resume2.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  });

  it('should maintain same public ID on republish', async () => {
    const result1 = await publishResume(testResumeId, testUserId);
    const publicId1 = result1.publicId;

    // Unpublish and republish
    await unpublishResume(testResumeId, testUserId);
    const result2 = await publishResume(testResumeId, testUserId);

    expect(result2.publicId).toBe(publicId1);
  });

  it('should generate valid UUID format for public ID', async () => {
    const publicId = generatePublicId();

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(publicId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

/**
 * Property 16: Publication Status Consistency
 * 
 * For any resume, the publication status (published/unpublished) should be
 * consistent across all queries, and unpublished resumes should not be
 * accessible via public URL.
 * 
 * **Validates: Requirements 4.5, 4.8**
 */
describe('Property 16: Publication Status Consistency', () => {
  let testUserId: string;
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
    await prisma.resumePublishing.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should return consistent published status', async () => {
    // Initially unpublished
    let status = await getPublicationStatus(testResumeId, testUserId);
    expect(status.published).toBe(false);

    // Publish
    await publishResume(testResumeId, testUserId);
    status = await getPublicationStatus(testResumeId, testUserId);
    expect(status.published).toBe(true);

    // Unpublish
    await unpublishResume(testResumeId, testUserId);
    status = await getPublicationStatus(testResumeId, testUserId);
    expect(status.published).toBe(false);
  });

  it('should not allow access to unpublished resume via public URL', async () => {
    // Create publishing record but don't publish
    const publishing = await prisma.resumePublishing.create({
      data: {
        resumeId: testResumeId,
        publicId: generatePublicId(),
        published: false,
      },
    });

    // Try to access via public URL
    const resume = await getPublishedResume(publishing.publicId);
    expect(resume).toBeNull();
  });

  it('should allow access to published resume via public URL', async () => {
    // Publish resume
    const result = await publishResume(testResumeId, testUserId);

    // Access via public URL
    const resume = await getPublishedResume(result.publicId!);
    expect(resume).not.toBeNull();
    expect(resume?.resume.id).toBe(testResumeId);
  });

  it('should prevent access after unpublishing', async () => {
    // Publish
    const result = await publishResume(testResumeId, testUserId);
    const publicId = result.publicId!;

    // Verify accessible
    let resume = await getPublishedResume(publicId);
    expect(resume).not.toBeNull();

    // Unpublish
    await unpublishResume(testResumeId, testUserId);

    // Verify not accessible
    resume = await getPublishedResume(publicId);
    expect(resume).toBeNull();
  });

  it('should maintain status across multiple queries', async () => {
    // Publish
    await publishResume(testResumeId, testUserId);

    // Query multiple times
    const status1 = await getPublicationStatus(testResumeId, testUserId);
    const status2 = await getPublicationStatus(testResumeId, testUserId);
    const status3 = await getPublicationStatus(testResumeId, testUserId);

    expect(status1.published).toBe(true);
    expect(status2.published).toBe(true);
    expect(status3.published).toBe(true);
    expect(status1.publicId).toBe(status2.publicId);
    expect(status2.publicId).toBe(status3.publicId);
  });
});

/**
 * Property 17: Public Resume Access Tracking
 * 
 * For any access to a published resume via public URL, a view event should be
 * recorded with correct timestamp and available metadata.
 * 
 * **Validates: Requirements 4.7, 5.1**
 */
describe('Property 17: Public Resume Access Tracking', () => {
  let testUserId: string;
  let testResumeId: string;
  let publicId: string;

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

    // Publish resume
    const result = await publishResume(testResumeId, testUserId);
    publicId = result.publicId!;
  });

  afterEach(async () => {
    await prisma.resumeAnalytics.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resumePublishing.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should record view event on public access', async () => {
    // Record view
    await recordPublicResumeView(publicId);

    // Verify event recorded
    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    expect(events.length).toBe(1);
    expect(events[0].resumeId).toBe(testResumeId);
  });

  it('should increment view count on each access', async () => {
    // Record multiple views
    for (let i = 0; i < 5; i++) {
      await recordPublicResumeView(publicId);
    }

    // Verify view count
    const publishing = await prisma.resumePublishing.findUnique({
      where: { publicId },
    });

    expect(publishing?.viewCount).toBe(5);
  });

  it('should record timestamp for each view', async () => {
    const beforeTime = new Date();

    // Record view
    await recordPublicResumeView(publicId);

    const afterTime = new Date();

    // Verify timestamp
    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    expect(events.length).toBe(1);
    expect(events[0].createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(events[0].createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it('should record metadata when provided', async () => {
    // Record view with metadata
    await recordPublicResumeView(publicId, {
      deviceType: 'mobile',
      browser: 'Chrome',
      operatingSystem: 'iOS',
    });

    // Verify metadata
    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    expect(events.length).toBe(1);
    expect(events[0].deviceType).toBe('mobile');
    expect(events[0].browser).toBe('Chrome');
    expect(events[0].operatingSystem).toBe('iOS');
  });

  it('should update lastViewedAt timestamp', async () => {
    const beforeTime = new Date();

    // Record view
    await recordPublicResumeView(publicId);

    const afterTime = new Date();

    // Verify lastViewedAt
    const publishing = await prisma.resumePublishing.findUnique({
      where: { publicId },
    });

    expect(publishing?.lastViewedAt).not.toBeNull();
    expect(publishing!.lastViewedAt!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(publishing!.lastViewedAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it('should not record view for unpublished resume', async () => {
    // Unpublish
    await unpublishResume(testResumeId, testUserId);

    // Try to record view
    await expect(recordPublicResumeView(publicId)).rejects.toThrow();

    // Verify no event recorded
    const events = await prisma.resumeAnalytics.findMany({
      where: {
        resumeId: testResumeId,
        eventType: 'view',
      },
    });

    expect(events.length).toBe(0);
  });
});
