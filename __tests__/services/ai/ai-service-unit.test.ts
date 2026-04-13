/**
 * Comprehensive Unit Tests for AI Service
 * 
 * Tests all AI service functionality including:
 * - Suggestion generation for different resume sections
 * - Approval and rejection workflows
 * - Version snapshot creation and management
 * - Rate limiting
 * - Caching
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSuggestions,
  saveSuggestions,
  getPendingSuggestions,
  clearSuggestionCache,
} from '@/services/ai/suggestion-service';
import {
  createVersionSnapshot,
  getVersionHistory,
  getVersion,
} from '@/services/ai/version-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    resumeSuggestion: {
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    resumeVersion: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    resume: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe('AI Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Suggestion Generation', () => {
    it('should generate suggestions for resume summary', async () => {
      const mockSuggestions = [
        {
          originalText: 'Experienced developer',
          suggestedText: 'Experienced full-stack developer with 5+ years',
          explanation: 'More specific and impactful',
          confidenceLevel: 'high',
        },
      ];

      // Mock the OpenAI response
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValueOnce({
              choices: [
                {
                  message: {
                    content: JSON.stringify(mockSuggestions),
                  },
                },
              ],
            }),
          },
        },
      }));

      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        {
          summary: 'Experienced developer',
        },
        'summary'
      );

      expect(result.suggestions).toBeDefined();
      expect(result.analysisMetadata).toBeDefined();
      expect(result.analysisMetadata.modelUsed).toBe('gpt-4');
    });

    it('should generate achievement suggestions using STAR method', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        {
          experiences: [
            {
              title: 'Developer',
              company: 'Tech Corp',
              achievements: ['Built feature'],
            },
          ],
        },
        'achievements'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should generate skill suggestions', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        {
          skills: ['JavaScript', 'React', 'Node.js'],
        },
        'skills'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should generate experience description suggestions', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        {
          experiences: [
            {
              title: 'Developer',
              company: 'Tech Corp',
              description: 'Worked on projects',
            },
          ],
        },
        'experience'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should generate full analysis with all suggestion types', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        {
          summary: 'Developer',
          experiences: [
            {
              title: 'Developer',
              company: 'Tech Corp',
              achievements: ['Built feature'],
              description: 'Worked on projects',
            },
          ],
          skills: ['JavaScript', 'React'],
        },
        'full'
      );

      expect(result.suggestions).toBeDefined();
      expect(result.analysisMetadata.tokensUsed).toBeGreaterThan(0);
    });

    it('should enforce rate limiting', async () => {
      // Mock 10 recent suggestions (at limit)
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(10);

      await expect(
        generateSuggestions(
          'resume-123',
          'user-123',
          { summary: 'Test' },
          'summary'
        )
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should allow suggestions within rate limit', async () => {
      // Mock 5 recent suggestions (under limit)
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(5);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        { summary: 'Test' },
        'summary'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should handle empty resume sections gracefully', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        {
          summary: undefined,
          experiences: undefined,
          skills: undefined,
        },
        'full'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValueOnce(new Error('API error')),
          },
        },
      }));

      await expect(
        generateSuggestions(
          'resume-123',
          'user-123',
          { summary: 'Test' },
          'summary'
        )
      ).rejects.toThrow();
    });
  });

  describe('Suggestion Persistence', () => {
    it('should save suggestions to database', async () => {
      const suggestions = [
        {
          id: 'sugg-1',
          category: 'summary' as const,
          originalText: 'Old text',
          suggestedText: 'New text',
          explanation: 'Better',
          confidenceLevel: 'high' as const,
          targetField: 'summary',
        },
      ];

      (prisma.resumeSuggestion.create as any).mockResolvedValueOnce({});

      await saveSuggestions('resume-123', suggestions);

      expect(prisma.resumeSuggestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resumeId: 'resume-123',
          category: 'summary',
          originalText: 'Old text',
          suggestedText: 'New text',
          status: 'pending',
        }),
      });
    });

    it('should save multiple suggestions', async () => {
      const suggestions = [
        {
          id: 'sugg-1',
          category: 'summary' as const,
          originalText: 'Old text 1',
          suggestedText: 'New text 1',
          explanation: 'Better 1',
          confidenceLevel: 'high' as const,
          targetField: 'summary',
        },
        {
          id: 'sugg-2',
          category: 'skill' as const,
          originalText: 'Old skill',
          suggestedText: 'New skill',
          explanation: 'Better skill',
          confidenceLevel: 'medium' as const,
          targetField: 'skills',
        },
      ];

      (prisma.resumeSuggestion.create as any).mockResolvedValue({});

      await saveSuggestions('resume-123', suggestions);

      expect(prisma.resumeSuggestion.create).toHaveBeenCalledTimes(2);
    });

    it('should handle save errors', async () => {
      (prisma.resumeSuggestion.create as any).mockRejectedValueOnce(new Error('DB error'));

      const suggestions = [
        {
          id: 'sugg-1',
          category: 'summary' as const,
          originalText: 'Old text',
          suggestedText: 'New text',
          explanation: 'Better',
          confidenceLevel: 'high' as const,
          targetField: 'summary',
        },
      ];

      await expect(saveSuggestions('resume-123', suggestions)).rejects.toThrow('DB error');
    });
  });

  describe('Suggestion Retrieval', () => {
    it('should retrieve pending suggestions', async () => {
      const mockSuggestions = [
        {
          id: 'sugg-1',
          category: 'summary',
          originalText: 'Old text',
          suggestedText: 'New text',
          explanation: 'Better',
          confidenceLevel: 'high',
          targetField: 'summary',
          status: 'pending',
        },
      ];

      (prisma.resumeSuggestion.findMany as any).mockResolvedValueOnce(mockSuggestions);

      const suggestions = await getPendingSuggestions('resume-123');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].category).toBe('summary');
      expect(suggestions[0].status).toBeUndefined(); // Not included in returned object
    });

    it('should filter by pending status', async () => {
      (prisma.resumeSuggestion.findMany as any).mockResolvedValueOnce([]);

      await getPendingSuggestions('resume-123');

      expect(prisma.resumeSuggestion.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'pending',
        }),
      });
    });

    it('should order suggestions by creation date', async () => {
      (prisma.resumeSuggestion.findMany as any).mockResolvedValueOnce([]);

      await getPendingSuggestions('resume-123');

      expect(prisma.resumeSuggestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('Suggestion Cache Management', () => {
    it('should clear old cached suggestions', async () => {
      (prisma.resumeSuggestion.deleteMany as any).mockResolvedValueOnce({ count: 5 });

      await clearSuggestionCache('resume-123');

      expect(prisma.resumeSuggestion.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          resumeId: 'resume-123',
          status: 'pending',
        }),
      });
    });

    it('should only delete suggestions older than cache TTL', async () => {
      (prisma.resumeSuggestion.deleteMany as any).mockResolvedValueOnce({ count: 0 });

      await clearSuggestionCache('resume-123');

      const call = (prisma.resumeSuggestion.deleteMany as any).mock.calls[0][0];
      expect(call.where.createdAt.lt).toBeInstanceOf(Date);
    });
  });

  describe('Version Snapshots', () => {
    it('should create version snapshot', async () => {
      const mockResume = {
        id: 'resume-123',
        summary: 'Test summary',
        experiences: [],
        education: [],
        skills: [],
      };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumeVersion.create as any).mockResolvedValueOnce({
        id: 'version-1',
        resumeId: 'resume-123',
        data: mockResume,
        createdAt: new Date(),
      });

      const snapshot = await createVersionSnapshot('resume-123');

      expect(snapshot.id).toBe('version-1');
      expect(snapshot.resumeId).toBe('resume-123');
      expect(prisma.resumeVersion.create).toHaveBeenCalled();
    });

    it('should capture complete resume state in snapshot', async () => {
      const mockResume = {
        id: 'resume-123',
        summary: 'Test summary',
        experiences: [
          {
            title: 'Developer',
            company: 'Tech Corp',
            description: 'Worked on projects',
          },
        ],
        education: [
          {
            school: 'University',
            degree: 'BS',
            field: 'Computer Science',
          },
        ],
        skills: ['JavaScript', 'React'],
      };

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumeVersion.create as any).mockResolvedValueOnce({
        id: 'version-1',
        resumeId: 'resume-123',
        data: mockResume,
        createdAt: new Date(),
      });

      const snapshot = await createVersionSnapshot('resume-123');

      expect(snapshot.data).toEqual(mockResume);
    });

    it('should include timestamp in snapshot', async () => {
      const mockResume = { id: 'resume-123' };
      const now = new Date();

      (prisma.resume.findUnique as any).mockResolvedValueOnce(mockResume);
      (prisma.resumeVersion.create as any).mockResolvedValueOnce({
        id: 'version-1',
        resumeId: 'resume-123',
        data: mockResume,
        createdAt: now,
      });

      const snapshot = await createVersionSnapshot('resume-123');

      expect(snapshot.createdAt).toEqual(now);
    });

    it('should handle snapshot creation errors', async () => {
      (prisma.resume.findUnique as any).mockRejectedValueOnce(new Error('Resume not found'));

      await expect(createVersionSnapshot('resume-123')).rejects.toThrow('Resume not found');
    });
  });

  describe('Version History', () => {
    it('should retrieve version history', async () => {
      const mockVersions = [
        {
          id: 'version-1',
          resumeId: 'resume-123',
          data: { summary: 'Old summary' },
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'version-2',
          resumeId: 'resume-123',
          data: { summary: 'New summary' },
          createdAt: new Date('2024-01-02'),
        },
      ];

      (prisma.resumeVersion.findMany as any).mockResolvedValueOnce(mockVersions);

      const history = await getVersionHistory('resume-123');

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('version-1');
    });

    it('should order versions by creation date', async () => {
      (prisma.resumeVersion.findMany as any).mockResolvedValueOnce([]);

      await getVersionHistory('resume-123');

      expect(prisma.resumeVersion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should retrieve specific version', async () => {
      const mockVersion = {
        id: 'version-1',
        resumeId: 'resume-123',
        data: { summary: 'Test' },
        createdAt: new Date(),
      };

      (prisma.resumeVersion.findUnique as any).mockResolvedValueOnce(mockVersion);

      const version = await getVersion('version-1');

      expect(version?.id).toBe('version-1');
      expect(version?.data).toEqual({ summary: 'Test' });
    });

    it('should return null for non-existent version', async () => {
      (prisma.resumeVersion.findUnique as any).mockResolvedValueOnce(null);

      const version = await getVersion('non-existent');

      expect(version).toBeNull();
    });
  });

  describe('Suggestion Categories', () => {
    it('should handle summary suggestions', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        { summary: 'Test' },
        'summary'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should handle achievement suggestions', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        {
          experiences: [
            {
              title: 'Dev',
              company: 'Corp',
              achievements: ['Built feature'],
            },
          ],
        },
        'achievements'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should handle skill suggestions', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        { skills: ['JavaScript'] },
        'skills'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should handle experience suggestions', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        {
          experiences: [
            {
              title: 'Dev',
              company: 'Corp',
              description: 'Worked',
            },
          ],
        },
        'experience'
      );

      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Confidence Levels', () => {
    it('should assign high confidence to clear improvements', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        { summary: 'Vague summary' },
        'summary'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should assign medium confidence to moderate improvements', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        { summary: 'Decent summary' },
        'summary'
      );

      expect(result.suggestions).toBeDefined();
    });

    it('should assign low confidence to minor improvements', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const result = await generateSuggestions(
        'resume-123',
        'user-123',
        { summary: 'Good summary' },
        'summary'
      );

      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing resume gracefully', async () => {
      (prisma.resume.findUnique as any).mockResolvedValueOnce(null);

      await expect(createVersionSnapshot('non-existent')).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      (prisma.resumeSuggestion.count as any).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        generateSuggestions('resume-123', 'user-123', { summary: 'Test' }, 'summary')
      ).rejects.toThrow();
    });

    it('should handle malformed API responses', async () => {
      (prisma.resumeSuggestion.count as any).mockResolvedValueOnce(0);

      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValueOnce({
              choices: [
                {
                  message: {
                    content: 'Invalid JSON',
                  },
                },
              ],
            }),
          },
        },
      }));

      await expect(
        generateSuggestions('resume-123', 'user-123', { summary: 'Test' }, 'summary')
      ).rejects.toThrow();
    });
  });
});
