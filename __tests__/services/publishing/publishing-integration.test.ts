/**
 * Integration Tests for Publishing
 * 
 * These tests validate complete publishing workflows including
 * publication, unpublication, and public access.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  publishResume,
  unpublishResume,
  getPublicationStatus,
  getPublishedResume,
  recordPublicResumeView,
  searchPublishedResumes,
} from '@/services/publishing/publishing-service';

describe('Publishing Integration Tests', () => {
  let testUserId: string;
  let testResumeId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    testUserId = user.id;

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Senior Software Engineer',
        slug: `test-${Date.now()}`,
        summary: 'Experienced software engineer with 10 years of experience',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        targetRoles: ['Senior Engineer', 'Tech Lead'],
        targetIndustry: 'Technology',
        location: 'San Francisco, CA',
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

  describe('Complete Publication Workflow', () => {
    it('should complete full publish-view-unpublish workflow', async () => {
      // 1. Verify initially unpublished
      let status = await getPublicationStatus(testResumeId, testUserId);
      expect(status.published).toBe(false);

      // 2. Publish resume
      const publishResult = await publishResume(testResumeId, testUserId);
      expect(publishResult.published).toBe(true);
      expect(publishResult.publicUrl).toBeDefined();
      expect(publishResult.publicId).toBeDefined();

      // 3. Verify published status
      status = await getPublicationStatus(testResumeId, testUserId);
      expect(status.published).toBe(true);
      expect(status.viewCount).toBe(0);

      // 4. Access via public URL
      const publicResume = await getPublishedResume(publishResult.publicId!);
      expect(publicResume).not.toBeNull();
      expect(publicResume?.resume.id).toBe(testResumeId);
      expect(publicResume?.publisherName).toBe('John Doe');

      // 5. Record view
      await recordPublicResumeView(publishResult.publicId!);

      // 6. Verify view count increased
      status = await getPublicationStatus(testResumeId, testUserId);
      expect(status.viewCount).toBe(1);

      // 7. Unpublish resume
      const unpublishResult = await unpublishResume(testResumeId, testUserId);
      expect(unpublishResult.published).toBe(false);

      // 8. Verify no longer accessible
      const inaccessibleResume = await getPublishedResume(publishResult.publicId!);
      expect(inaccessibleResume).toBeNull();
    });

    it('should maintain view count after unpublishing', async () => {
      // Publish and record views
      const publishResult = await publishResume(testResumeId, testUserId);
      await recordPublicResumeView(publishResult.publicId!);
      await recordPublicResumeView(publishResult.publicId!);

      let status = await getPublicationStatus(testResumeId, testUserId);
      expect(status.viewCount).toBe(2);

      // Unpublish
      await unpublishResume(testResumeId, testUserId);

      // Verify view count still exists in database
      const publishing = await prisma.resumePublishing.findUnique({
        where: { resumeId: testResumeId },
      });

      expect(publishing?.viewCount).toBe(2);
    });

    it('should allow republishing with same public ID', async () => {
      // Publish
      const publishResult1 = await publishResume(testResumeId, testUserId);
      const publicId1 = publishResult1.publicId;

      // Unpublish
      await unpublishResume(testResumeId, testUserId);

      // Republish
      const publishResult2 = await publishResume(testResumeId, testUserId);
      const publicId2 = publishResult2.publicId;

      expect(publicId1).toBe(publicId2);
    });
  });

  describe('Public Resume Access', () => {
    it('should include all resume data in public view', async () => {
      // Add experiences
      await prisma.resumeExperience.create({
        data: {
          resumeId: testResumeId,
          company: 'Tech Corp',
          role: 'Senior Engineer',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-12-31'),
          description: 'Led team of 5 engineers',
          achievements: ['Increased performance by 40%', 'Mentored 3 junior engineers'],
        },
      });

      // Add education
      await prisma.resumeEducation.create({
        data: {
          resumeId: testResumeId,
          school: 'MIT',
          degree: 'BS',
          field: 'Computer Science',
        },
      });

      // Add project
      await prisma.resumeProject.create({
        data: {
          resumeId: testResumeId,
          name: 'Open Source Project',
          summary: 'Popular open source library',
          link: 'https://github.com/example',
          techStack: ['TypeScript', 'React'],
        },
      });

      // Publish and access
      const publishResult = await publishResume(testResumeId, testUserId);
      const publicResume = await getPublishedResume(publishResult.publicId!);

      expect(publicResume?.resume.experiences.length).toBe(1);
      expect(publicResume?.resume.education.length).toBe(1);
      expect(publicResume?.resume.projects.length).toBe(1);
      expect(publicResume?.resume.skills).toContain('JavaScript');
      expect(publicResume?.resume.targetRoles).toContain('Senior Engineer');
    });

    it('should track multiple views correctly', async () => {
      const publishResult = await publishResume(testResumeId, testUserId);

      // Record 10 views
      for (let i = 0; i < 10; i++) {
        await recordPublicResumeView(publishResult.publicId!);
      }

      // Verify view count
      const status = await getPublicationStatus(testResumeId, testUserId);
      expect(status.viewCount).toBe(10);

      // Verify analytics events
      const events = await prisma.resumeAnalytics.findMany({
        where: {
          resumeId: testResumeId,
          eventType: 'view',
        },
      });

      expect(events.length).toBe(10);
    });
  });

  describe('Discovery and Search', () => {
    it('should find published resume in search', async () => {
      // Publish resume
      await publishResume(testResumeId, testUserId);

      // Search by keyword
      const results = await searchPublishedResumes('Senior Software Engineer');

      expect(results.total).toBeGreaterThan(0);
      expect(results.results.some(r => r.publicId)).toBe(true);
    });

    it('should filter by skills', async () => {
      // Publish resume
      await publishResume(testResumeId, testUserId);

      // Search by skill
      const results = await searchPublishedResumes(undefined, ['JavaScript']);

      expect(results.total).toBeGreaterThan(0);
      expect(results.results[0].skills).toContain('JavaScript');
    });

    it('should filter by target roles', async () => {
      // Publish resume
      await publishResume(testResumeId, testUserId);

      // Search by role
      const results = await searchPublishedResumes(undefined, undefined, ['Senior Engineer']);

      expect(results.total).toBeGreaterThan(0);
      expect(results.results[0].targetRoles).toContain('Senior Engineer');
    });

    it('should filter by industry', async () => {
      // Publish resume
      await publishResume(testResumeId, testUserId);

      // Search by industry
      const results = await searchPublishedResumes(undefined, undefined, undefined, ['Technology']);

      expect(results.total).toBeGreaterThan(0);
      expect(results.results[0].targetIndustry).toBe('Technology');
    });

    it('should support pagination', async () => {
      // Publish resume
      await publishResume(testResumeId, testUserId);

      // Get first page
      const page1 = await searchPublishedResumes(undefined, undefined, undefined, undefined, 1, 0);
      expect(page1.results.length).toBeLessThanOrEqual(1);
      expect(page1.offset).toBe(0);

      // Get second page
      const page2 = await searchPublishedResumes(undefined, undefined, undefined, undefined, 1, 1);
      expect(page2.offset).toBe(1);
    });

    it('should not include unpublished resumes in search', async () => {
      // Don't publish resume
      const results = await searchPublishedResumes('Senior Software Engineer');

      // Should not find this resume
      expect(results.results.some(r => r.publicId)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should prevent publishing non-existent resume', async () => {
      await expect(publishResume('non-existent-id', testUserId)).rejects.toThrow('Resume not found');
    });

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
      // Publish first
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

    it('should prevent accessing unpublished resume via public URL', async () => {
      // Create publishing record but don't publish
      const publishing = await prisma.resumePublishing.create({
        data: {
          resumeId: testResumeId,
          publicId: 'test-public-id',
          published: false,
        },
      });

      const resume = await getPublishedResume(publishing.publicId);
      expect(resume).toBeNull();
    });
  });
});
