/**
 * Checkpoint Tests for Publishing
 * 
 * These tests verify that the publishing system works correctly end-to-end
 * and is ready for production use.
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

describe('Publishing Checkpoint Tests', () => {
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
        summary: 'Test summary',
        skills: ['Skill1', 'Skill2'],
        targetRoles: ['Role1'],
      },
    });

    testResumeId = resume.id;
  });

  afterEach(async () => {
    await prisma.resumeAnalytics.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resumePublishing.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('Resume Publication', () => {
    it('should successfully publish a resume', async () => {
      const result = await publishResume(testResumeId, testUserId);

      expect(result.published).toBe(true);
      expect(result.publicUrl).toBeDefined();
      expect(result.publicId).toBeDefined();
      expect(result.publishedAt).toBeDefined();
      expect(result.viewCount).toBe(0);
    });

    it('should generate unique public IDs', async () => {
      const id1 = generatePublicId();
      const id2 = generatePublicId();

      expect(id1).not.toBe(id2);
    });

    it('should prevent duplicate publication', async () => {
      await publishResume(testResumeId, testUserId);

      // Try to publish again
      await expect(publishResume(testResumeId, testUserId)).rejects.toThrow('already published');
    });
  });

  describe('Publication Status', () => {
    it('should return correct publication status', async () => {
      // Initially unpublished
      let status = await getPublicationStatus(testResumeId, testUserId);
      expect(status.published).toBe(false);

      // After publishing
      const publishResult = await publishResume(testResumeId, testUserId);
      status = await getPublicationStatus(testResumeId, testUserId);

      expect(status.published).toBe(true);
      expect(status.publicUrl).toBe(`/public/resumes/${publishResult.publicId}`);
      expect(status.viewCount).toBe(0);
    });

    it('should track view count in status', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);

      // Record views
      for (let i = 0; i < 3; i++) {
        await recordPublicResumeView(publishResult.publicId!);
      }

      const status = await getPublicationStatus(testResumeId, testUserId);
      expect(status.viewCount).toBe(3);
    });
  });

  describe('Public Resume Access', () => {
    it('should allow access to published resume', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);
      const resume = await getPublishedResume(publishResult.publicId!);

      expect(resume).not.toBeNull();
      expect(resume?.resume.id).toBe(testResumeId);
      expect(resume?.publisherName).toBe('Test User');
      expect(resume?.publishedAt).toBeDefined();
      expect(resume?.viewCount).toBe(0);
    });

    it('should deny access to unpublished resume', async () => {
      const publishing = await prisma.resumePublishing.create({
        data: {
          resumeId: testResumeId,
          publicId: generatePublicId(),
          published: false,
        },
      });

      const resume = await getPublishedResume(publishing.publicId);
      expect(resume).toBeNull();
    });

    it('should deny access after unpublishing', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);
      const publicId = publishResult.publicId!;

      // Verify accessible
      let resume = await getPublishedResume(publicId);
      expect(resume).not.toBeNull();

      // Unpublish
      await unpublishResume(testResumeId, testUserId);

      // Verify not accessible
      resume = await getPublishedResume(publicId);
      expect(resume).toBeNull();
    });
  });

  describe('View Tracking', () => {
    it('should record view on public access', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);

      // Record view
      await recordPublicResumeView(publishResult.publicId!);

      // Verify event recorded
      const events = await prisma.resumeAnalytics.findMany({
        where: {
          resumeId: testResumeId,
          eventType: 'view',
        },
      });

      expect(events.length).toBe(1);
    });

    it('should increment view count correctly', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);

      // Record multiple views
      for (let i = 0; i < 5; i++) {
        await recordPublicResumeView(publishResult.publicId!);
      }

      // Verify view count
      const publishing = await prisma.resumePublishing.findUnique({
        where: { publicId: publishResult.publicId! },
      });

      expect(publishing?.viewCount).toBe(5);
    });

    it('should update lastViewedAt timestamp', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);

      const beforeTime = new Date();
      await recordPublicResumeView(publishResult.publicId!);
      const afterTime = new Date();

      const publishing = await prisma.resumePublishing.findUnique({
        where: { publicId: publishResult.publicId! },
      });

      expect(publishing?.lastViewedAt).not.toBeNull();
      expect(publishing!.lastViewedAt!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(publishing!.lastViewedAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Resume Unpublication', () => {
    it('should successfully unpublish a resume', async () => {
      // Publish first
      await publishResume(testResumeId, testUserId);

      // Unpublish
      const result = await unpublishResume(testResumeId, testUserId);

      expect(result.published).toBe(false);
    });

    it('should maintain view count after unpublishing', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);

      // Record views
      for (let i = 0; i < 3; i++) {
        await recordPublicResumeView(publishResult.publicId!);
      }

      // Unpublish
      await unpublishResume(testResumeId, testUserId);

      // Verify view count still exists
      const publishing = await prisma.resumePublishing.findUnique({
        where: { resumeId: testResumeId },
      });

      expect(publishing?.viewCount).toBe(3);
    });

    it('should allow republishing with same public ID', async () => {
      const publishResult1 = await publishResume(testResumeId, testUserId);
      const publicId1 = publishResult1.publicId;

      await unpublishResume(testResumeId, testUserId);

      const publishResult2 = await publishResume(testResumeId, testUserId);
      const publicId2 = publishResult2.publicId;

      expect(publicId1).toBe(publicId2);
    });
  });

  describe('Authorization', () => {
    it('should prevent publishing resume owned by another user', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          passwordHash: 'hash',
          firstName: 'Other',
          lastName: 'User',
        },
      });

      await expect(publishResume(testResumeId, otherUser.id)).rejects.toThrow('Access denied');

      // Cleanup
      await prisma.user.deleteMany({ where: { id: otherUser.id } });
    });

    it('should prevent unpublishing resume owned by another user', async () => {
      await publishResume(testResumeId, testUserId);

      const otherUser = await prisma.user.create({
        data: {
          email: `other2-${Date.now()}@example.com`,
          passwordHash: 'hash',
          firstName: 'Other2',
          lastName: 'User2',
        },
      });

      await expect(unpublishResume(testResumeId, otherUser.id)).rejects.toThrow('Access denied');

      // Cleanup
      await prisma.user.deleteMany({ where: { id: otherUser.id } });
    });

    it('should prevent getting status for resume owned by another user', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: `other3-${Date.now()}@example.com`,
          passwordHash: 'hash',
          firstName: 'Other3',
          lastName: 'User3',
        },
      });

      await expect(getPublicationStatus(testResumeId, otherUser.id)).rejects.toThrow('Access denied');

      // Cleanup
      await prisma.user.deleteMany({ where: { id: otherUser.id } });
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);

      // Verify publishing record exists
      const publishing = await prisma.resumePublishing.findUnique({
        where: { resumeId: testResumeId },
      });

      expect(publishing).not.toBeNull();
      expect(publishing?.resumeId).toBe(testResumeId);
      expect(publishing?.publicId).toBe(publishResult.publicId);
    });

    it('should handle concurrent views correctly', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);

      // Record views concurrently
      await Promise.all([
        recordPublicResumeView(publishResult.publicId!),
        recordPublicResumeView(publishResult.publicId!),
        recordPublicResumeView(publishResult.publicId!),
      ]);

      // Verify all views recorded
      const publishing = await prisma.resumePublishing.findUnique({
        where: { publicId: publishResult.publicId! },
      });

      expect(publishing?.viewCount).toBe(3);
    });
  });
});
