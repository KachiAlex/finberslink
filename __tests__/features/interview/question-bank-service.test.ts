import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  getQuestionsByRole,
  getQuestionTemplates,
  createQuestionTemplate,
  getAvailableRoles,
  getAvailableCategories,
  deleteQuestionTemplate,
  updateQuestionTemplate,
} from '@/features/interview/question-bank-service';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    questionTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Question Bank Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuestionsByRole', () => {
    it('should return questions for a specific role', async () => {
      const mockQuestions = [
        {
          id: '1',
          text: 'Tell me about yourself',
          targetRole: 'Software Engineer',
          category: 'Behavioral',
          difficulty: 'easy' as const,
          estimatedTime: 120,
          rubric: 'Look for clarity and structure',
        },
        {
          id: '2',
          text: 'Design a system',
          targetRole: 'Software Engineer',
          category: 'Technical',
          difficulty: 'hard' as const,
          estimatedTime: 300,
          rubric: 'Evaluate scalability thinking',
        },
      ];

      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue(mockQuestions);

      const result = await getQuestionsByRole('Software Engineer');

      expect(result).toEqual(mockQuestions);
      expect(prisma.questionTemplate.findMany).toHaveBeenCalledWith({
        where: { targetRole: 'Software Engineer' },
        orderBy: { difficulty: 'asc' },
        take: 7,
      });
    });

    it('should return empty array when no questions found', async () => {
      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue([]);

      const result = await getQuestionsByRole('NonExistentRole');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(prisma.questionTemplate.findMany).mockRejectedValue(error);

      await expect(getQuestionsByRole('Software Engineer')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getQuestionTemplates', () => {
    it('should return all templates with pagination', async () => {
      const mockTemplates = [
        {
          id: '1',
          text: 'Question 1',
          targetRole: 'Software Engineer',
          category: 'Behavioral',
          difficulty: 'easy' as const,
          estimatedTime: 120,
          rubric: null,
        },
      ];

      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue(mockTemplates);

      const result = await getQuestionTemplates({ page: 1, limit: 20 });

      expect(result.templates).toEqual(mockTemplates);
      expect(result.total).toBeDefined();
      expect(prisma.questionTemplate.findMany).toHaveBeenCalled();
    });

    it('should filter by role', async () => {
      const mockTemplates = [];
      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue(mockTemplates);

      await getQuestionTemplates({ role: 'Product Manager', page: 1, limit: 20 });

      expect(prisma.questionTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            targetRole: 'Product Manager',
          }),
        })
      );
    });

    it('should filter by difficulty', async () => {
      const mockTemplates = [];
      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue(mockTemplates);

      await getQuestionTemplates({ difficulty: 'hard', page: 1, limit: 20 });

      expect(prisma.questionTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: 'hard',
          }),
        })
      );
    });

    it('should filter by category', async () => {
      const mockTemplates = [];
      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue(mockTemplates);

      await getQuestionTemplates({ category: 'Technical', page: 1, limit: 20 });

      expect(prisma.questionTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Technical',
          }),
        })
      );
    });
  });

  describe('createQuestionTemplate', () => {
    it('should create a new question template', async () => {
      const input = {
        text: 'New question',
        targetRole: 'Data Scientist',
        category: 'Technical',
        difficulty: 'medium' as const,
        estimatedTime: 180,
        rubric: 'Evaluate technical depth',
      };

      const mockCreated = {
        id: 'new-id',
        ...input,
      };

      vi.mocked(prisma.questionTemplate.create).mockResolvedValue(mockCreated);

      const result = await createQuestionTemplate(input);

      expect(result).toEqual(mockCreated);
      expect(prisma.questionTemplate.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it('should validate required fields', async () => {
      const invalidInput = {
        text: '',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
      };

      await expect(createQuestionTemplate(invalidInput)).rejects.toThrow();
    });

    it('should handle database errors during creation', async () => {
      const input = {
        text: 'Question',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
      };

      const error = new Error('Unique constraint failed');
      vi.mocked(prisma.questionTemplate.create).mockRejectedValue(error);

      await expect(createQuestionTemplate(input)).rejects.toThrow(
        'Unique constraint failed'
      );
    });
  });

  describe('getAvailableRoles', () => {
    it('should return unique roles', async () => {
      const mockQuestions = [
        { targetRole: 'Software Engineer' },
        { targetRole: 'Product Manager' },
        { targetRole: 'Software Engineer' },
      ];

      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue(mockQuestions);

      const result = await getAvailableRoles();

      expect(result).toContain('Software Engineer');
      expect(result).toContain('Product Manager');
      expect(new Set(result).size).toBe(result.length); // All unique
    });

    it('should return empty array when no roles exist', async () => {
      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue([]);

      const result = await getAvailableRoles();

      expect(result).toEqual([]);
    });
  });

  describe('getAvailableCategories', () => {
    it('should return unique categories', async () => {
      const mockQuestions = [
        { category: 'Behavioral' },
        { category: 'Technical' },
        { category: 'Behavioral' },
      ];

      vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue(mockQuestions);

      const result = await getAvailableCategories();

      expect(result).toContain('Behavioral');
      expect(result).toContain('Technical');
      expect(new Set(result).size).toBe(result.length); // All unique
    });
  });

  describe('updateQuestionTemplate', () => {
    it('should update a question template', async () => {
      const templateId = 'template-1';
      const updates = {
        text: 'Updated question',
        difficulty: 'hard' as const,
      };

      const mockUpdated = {
        id: templateId,
        text: 'Updated question',
        targetRole: 'Software Engineer',
        category: 'Technical',
        difficulty: 'hard' as const,
        estimatedTime: 300,
        rubric: null,
      };

      vi.mocked(prisma.questionTemplate.update).mockResolvedValue(mockUpdated);

      const result = await updateQuestionTemplate(templateId, updates);

      expect(result).toEqual(mockUpdated);
      expect(prisma.questionTemplate.update).toHaveBeenCalledWith({
        where: { id: templateId },
        data: updates,
      });
    });

    it('should throw error if template not found', async () => {
      const error = new Error('Template not found');
      vi.mocked(prisma.questionTemplate.update).mockRejectedValue(error);

      await expect(
        updateQuestionTemplate('nonexistent', { text: 'Updated' })
      ).rejects.toThrow('Template not found');
    });
  });

  describe('deleteQuestionTemplate', () => {
    it('should delete a question template', async () => {
      const templateId = 'template-1';
      const mockDeleted = {
        id: templateId,
        text: 'Deleted question',
        targetRole: 'Software Engineer',
        category: 'Technical',
        difficulty: 'easy' as const,
        estimatedTime: 120,
        rubric: null,
      };

      vi.mocked(prisma.questionTemplate.delete).mockResolvedValue(mockDeleted);

      const result = await deleteQuestionTemplate(templateId);

      expect(result).toEqual(mockDeleted);
      expect(prisma.questionTemplate.delete).toHaveBeenCalledWith({
        where: { id: templateId },
      });
    });

    it('should throw error if template not found', async () => {
      const error = new Error('Template not found');
      vi.mocked(prisma.questionTemplate.delete).mockRejectedValue(error);

      await expect(deleteQuestionTemplate('nonexistent')).rejects.toThrow(
        'Template not found'
      );
    });
  });
});
