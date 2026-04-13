/**
 * Comprehensive Unit Tests for Publishing Service
 * 
 * Tests all publishing service functionality including:
 * - URL generation and uniqueness
 * - Publication status management
 * - Access control and authorization
 * - Public resume access
 * - View tracking
 * - Search and discovery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  publishResume,
  unpublishResume,
  getPublicationStatus,
  getPublishedResume,
  recordPublicResumeView,
  searchPublishedResumes,
  generatePublicId,
} from '@/services/publishing/publishing-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findUnique: vi.fn(),
    },
    resumePublishing: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock analytics service
vi.mock('@/services/analytics/analytics-service', () => ({
  recordAnalyticsEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('Publishing Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Public ID Generation', () => {
    it('should generate unique public IDs', () => {
      const id1 = generatePublicId();
      const id2 = generatePublicId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate valid UUID format', () => {
      const id = generatePublicId();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate consistent format across multiple calls', () => {
      const ids = Array.from({ length: 10 }, () => generatePublicId());

      ids.forEach(id => {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      });
    });
  });

  describe('Resume Publication', () => {
    it('should publish resume successfully', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };
      const mockPublicId = 'public-id-123';

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(null);
      (prisma.resumePublishing.upsert as any).mockResolvedValueOnce({
        resumeId: 'resume-123',
        publicId: mockPublicId,
        published: true,
        publishedAt: new Date(),
        viewCount: 0,
      });

      const result = await publishResume('resume-123', 'user-123');

      expect(result.published).toBe(true);
      expect(result.publicUrl).toContain(mockPublicId);
      expect(result.publicId).toBe(mockPublicId);
    });

    it('should verify user ownership before publishing', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-456' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);

      await expect(publishResume('resume-123', 'user-123')).rejects.toThrow(
        'Access denied'
      );
    });

    it('should prevent publishing already published resume', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };
      const mockPublishing = {
        resumeId: 'resume-123',
        publicId: 'public-id-123',
        published: true,
      };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(mockPublishing);

      await expect(publishResume('resume-123', 'user-123')).rejects.toThrow(
        'already published'
      );
    });

    it('should handle non-existent resume', async () => {
      (prisma.resume.findUnique as any).mockResolvedValueOnce(null);

      await expect(publishResume('non-existent', 'user-123')).rejects.toThrow(
        'Resume not found'
      );
    });

    it('should generate public URL in correct format', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };
      const mockPublicId = 'abc-def-ghi';

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(null);
      (prisma.resumePublishing.upsert as any).mockResolvedValueOnce({
        resumeId: 'resume-123',
        publicId: mockPublicId,
        published: true,
        publishedAt: new Date(),
        viewCount: 0,
      });

      const result = await publishResume('resume-123', 'user-123');

      expect(result.publicUrl).toBe(`/public/resumes/${mockPublicId}`);
    });

    it('should set publication timestamp', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };
      const now = new Date();

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(null);
      (prisma.resumePublishing.upsert as any).mockResolvedValueOnce({
        resumeId: 'resume-123',
        publicId: 'public-id',
        published: true,
        publishedAt: now,
        viewCount: 0,
      });

      const result = await publishResume('resume-123', 'user-123');

      expect(result.publishedAt).toEqual(now);
    });
  });

  describe('Resume Unpublication', () => {
    it('should unpublish resume successfully', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.update as any).mockResolvedValueOnce({
        resumeId: 'resume-123',
        published: false,
        unpublishedAt: new Date(),
        viewCount: 100,
      });

      const result = await unpublishResume('resume-123', 'user-123');

      expect(result.published).toBe(false);
    });

    it('should verify user ownership before unpublishing', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-456' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);

      await expect(unpublishResume('resume-123', 'user-123')).rejects.toThrow(
        'Access denied'
      );
    });

    it('should set unpublication timestamp', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };
      const now = new Date();

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.update as any).mockResolvedValueOnce({
        resumeId: 'resume-123',
        published: false,
        unpublishedAt: now,
        viewCount: 50,
      });

      const result = await unpublishResume('resume-123', 'user-123');

      expect(result.published).toBe(false);
    });

    it('should preserve view count after unpublication', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.update as any).mockResolvedValueOnce({
        resumeId: 'resume-123',
        published: false,
        viewCount: 150,
      });

      const result = await unpublishResume('resume-123', 'user-123');

      expect(result.viewCount).toBe(150);
    });
  });

  describe('Publication Status', () => {
    it('should retrieve publication status for published resume', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };
      const mockPublishing = {
        resumeId: 'resume-123',
        publicId: 'public-id-123',
        published: true,
        publishedAt: new Date(),
        viewCount: 50,
      };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(mockPublishing);

      const status = await getPublicationStatus('resume-123', 'user-123');

      expect(status.published).toBe(true);
      expect(status.publicUrl).toContain('public-id-123');
      expect(status.viewCount).toBe(50);
    });

    it('should retrieve publication status for unpublished resume', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(null);

      const status = await getPublicationStatus('resume-123', 'user-123');

      expect(status.published).toBe(false);
      expect(status.publicUrl).toBeUndefined();
      expect(status.viewCount).toBe(0);
    });

    it('should verify user ownership when checking status', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-456' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);

      await expect(getPublicationStatus('resume-123', 'user-123')).rejects.toThrow(
        'Access denied'
      );
    });
  });

  describe('Public Resume Access', () => {
    it('should retrieve published resume by public ID', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: true,
        publishedAt: new Date(),
        viewCount: 50,
        resume: {
          id: 'resume-123',
          summary: 'Test summary',
          experiences: [],
          education: [],
          projects: [],
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(mockPublishing);

      const result = await getPublishedResume('public-id-123');

      expect(result).toBeDefined();
      expect(result?.resume.id).toBe('resume-123');
      expect(result?.publisherName).toBe('John Doe');
      expect(result?.viewCount).toBe(50);
    });

    it('should return null for unpublished resume', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: false,
      };

      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(mockPublishing);

      const result = await getPublishedResume('public-id-123');

      expect(result).toBeNull();
    });

    it('should return null for non-existent public ID', async () => {
      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(null);

      const result = await getPublishedResume('non-existent');

      expect(result).toBeNull();
    });

    it('should include all resume sections', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: true,
        publishedAt: new Date(),
        viewCount: 50,
        resume: {
          id: 'resume-123',
          summary: 'Test summary',
          experiences: [{ title: 'Dev', company: 'Corp' }],
          education: [{ school: 'University', degree: 'BS' }],
          projects: [{ name: 'Project 1' }],
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(mockPublishing);

      const result = await getPublishedResume('public-id-123');

      expect(result?.resume.experiences).toBeDefined();
      expect(result?.resume.education).toBeDefined();
      expect(result?.resume.projects).toBeDefined();
    });
  });

  describe('View Tracking', () => {
    it('should record view for published resume', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: true,
        resumeId: 'resume-123',
        viewCount: 50,
      };

      (prisma.resumePublishing.findUnique as any)
        .mockResolvedValueOnce(mockPublishing)
        .mockResolvedValueOnce(mockPublishing);

      (prisma.resumePublishing.update as any).mockResolvedValueOnce({
        viewCount: 51,
        lastViewedAt: new Date(),
      });

      await recordPublicResumeView('public-id-123', { country: 'US' });

      expect(prisma.resumePublishing.update).toHaveBeenCalledWith({
        where: { publicId: 'public-id-123' },
        data: expect.objectContaining({
          viewCount: { increment: 1 },
          lastViewedAt: expect.any(Date),
        }),
      });
    });

    it('should reject view recording for unpublished resume', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: false,
      };

      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(mockPublishing);

      await expect(recordPublicResumeView('public-id-123')).rejects.toThrow(
        'not published'
      );
    });

    it('should include metadata in view event', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: true,
        resumeId: 'resume-123',
      };

      (prisma.resumePublishing.findUnique as any)
        .mockResolvedValueOnce(mockPublishing)
        .mockResolvedValueOnce(mockPublishing);

      (prisma.resumePublishing.update as any).mockResolvedValueOnce({});

      const { recordAnalyticsEvent } = await import('@/services/analytics/analytics-service');

      await recordPublicResumeView('public-id-123', {
        country: 'US',
        deviceType: 'mobile',
        browser: 'Chrome',
      });

      expect(recordAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          resumeId: 'resume-123',
          eventType: 'view',
          country: 'US',
          deviceType: 'mobile',
          browser: 'Chrome',
        })
      );
    });

    it('should update last viewed timestamp', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: true,
        resumeId: 'resume-123',
      };

      (prisma.resumePublishing.findUnique as any)
        .mockResolvedValueOnce(mockPublishing)
        .mockResolvedValueOnce(mockPublishing);

      (prisma.resumePublishing.update as any).mockResolvedValueOnce({});

      await recordPublicResumeView('public-id-123');

      const updateCall = (prisma.resumePublishing.update as any).mock.calls[0][0];
      expect(updateCall.data.lastViewedAt).toBeInstanceOf(Date);
    });
  });

  describe('Search and Discovery', () => {
    it('should search published resumes by keyword', async () => {
      const mockResults = [
        {
          publicId: 'public-1',
          publicUrl: '/public/resumes/public-1',
          published: true,
          publishedAt: new Date(),
          viewCount: 50,
          resume: {
            summary: 'Experienced developer',
            skills: ['JavaScript', 'React'],
            targetRoles: ['Developer'],
            targetIndustry: 'Tech',
            user: { firstName: 'John', lastName: 'Doe' },
          },
        },
      ];

      (prisma.resumePublishing.count as any).mockResolvedValueOnce(1);
      (prisma.resumePublishing.findMany as any).mockResolvedValueOnce(mockResults);

      const results = await searchPublishedResumes('developer');

      expect(results.results).toHaveLength(1);
      expect(results.total).toBe(1);
    });

    it('should filter by skills', async () => {
      (prisma.resumePublishing.count as any).mockResolvedValueOnce(0);
      (prisma.resumePublishing.findMany as any).mockResolvedValueOnce([]);

      await searchPublishedResumes(undefined, ['JavaScript', 'React']);

      expect(prisma.resumePublishing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            published: true,
          }),
        })
      );
    });

    it('should filter by target roles', async () => {
      (prisma.resumePublishing.count as any).mockResolvedValueOnce(0);
      (prisma.resumePublishing.findMany as any).mockResolvedValueOnce([]);

      await searchPublishedResumes(undefined, undefined, ['Developer', 'Engineer']);

      expect(prisma.resumePublishing.findMany).toHaveBeenCalled();
    });

    it('should filter by industries', async () => {
      (prisma.resumePublishing.count as any).mockResolvedValueOnce(0);
      (prisma.resumePublishing.findMany as any).mockResolvedValueOnce([]);

      await searchPublishedResumes(undefined, undefined, undefined, ['Tech', 'Finance']);

      expect(prisma.resumePublishing.findMany).toHaveBeenCalled();
    });

    it('should support pagination', async () => {
      (prisma.resumePublishing.count as any).mockResolvedValueOnce(100);
      (prisma.resumePublishing.findMany as any).mockResolvedValueOnce([]);

      const results = await searchPublishedResumes(undefined, undefined, undefined, undefined, 20, 40);

      expect(results.limit).toBe(20);
      expect(results.offset).toBe(40);
      expect(prisma.resumePublishing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 40,
        })
      );
    });

    it('should return pagination metadata', async () => {
      (prisma.resumePublishing.count as any).mockResolvedValueOnce(100);
      (prisma.resumePublishing.findMany as any).mockResolvedValueOnce([]);

      const results = await searchPublishedResumes(undefined, undefined, undefined, undefined, 20, 0);

      expect(results.total).toBe(100);
      expect(results.hasMore).toBe(true);
    });

    it('should order results by view count', async () => {
      (prisma.resumePublishing.count as any).mockResolvedValueOnce(0);
      (prisma.resumePublishing.findMany as any).mockResolvedValueOnce([]);

      await searchPublishedResumes();

      expect(prisma.resumePublishing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
        })
      );
    });

    it('should include publisher information in results', async () => {
      const mockResults = [
        {
          publicId: 'public-1',
          publicUrl: '/public/resumes/public-1',
          published: true,
          publishedAt: new Date(),
          viewCount: 50,
          resume: {
            summary: 'Test',
            skills: [],
            targetRoles: [],
            user: { firstName: 'John', lastName: 'Doe' },
          },
        },
      ];

      (prisma.resumePublishing.count as any).mockResolvedValueOnce(1);
      (prisma.resumePublishing.findMany as any).mockResolvedValueOnce(mockResults);

      const results = await searchPublishedResumes();

      expect(results.results[0].publisherName).toBe('John Doe');
    });
  });

  describe('Access Control', () => {
    it('should prevent unauthorized publication', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-456' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);

      await expect(publishResume('resume-123', 'user-123')).rejects.toThrow(
        'Access denied'
      );
    });

    it('should prevent unauthorized unpublication', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-456' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);

      await expect(unpublishResume('resume-123', 'user-123')).rejects.toThrow(
        'Access denied'
      );
    });

    it('should prevent unauthorized status check', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-456' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);

      await expect(getPublicationStatus('resume-123', 'user-123')).rejects.toThrow(
        'Access denied'
      );
    });

    it('should allow public access to published resumes', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: true,
        resume: {
          id: 'resume-123',
          user: { firstName: 'John', lastName: 'Doe' },
        },
      };

      (prisma.resumePublishing.findUnique as any).mockResolvedValueOnce(mockPublishing);

      const result = await getPublishedResume('public-id-123');

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during publication', async () => {
      (prisma.resume.findUnique as any).mockRejectedValueOnce(new Error('DB error'));

      await expect(publishResume('resume-123', 'user-123')).rejects.toThrow('DB error');
    });

    it('should handle database errors during unpublication', async () => {
      const mockResume = { id: 'resume-123', userId: 'user-123' };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumePublishing.update as any).mockRejectedValueOnce(new Error('DB error'));

      await expect(unpublishResume('resume-123', 'user-123')).rejects.toThrow('DB error');
    });

    it('should handle database errors during view recording', async () => {
      const mockPublishing = {
        publicId: 'public-id-123',
        published: true,
        resumeId: 'resume-123',
      };

      (prisma.resumePublishing.findUnique as any)
        .mockResolvedValueOnce(mockPublishing)
        .mockResolvedValueOnce(mockPublishing);

      (prisma.resumePublishing.update as any).mockRejectedValueOnce(new Error('DB error'));

      await expect(recordPublicResumeView('public-id-123')).rejects.toThrow('DB error');
    });
  });
});
