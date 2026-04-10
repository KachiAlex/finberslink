import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/interview/question-templates/by-role/[role]/route';
import { getServerSession } from 'next-auth/next';

// Mock dependencies
vi.mock('next-auth/next');
vi.mock('@/features/interview/question-bank-service');

describe('GET /api/interview/question-templates/by-role/[role]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/interview/question-templates/by-role/Software%20Engineer'
    );

    const response = await GET(request, {
      params: { role: 'Software Engineer' },
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if role parameter is invalid', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/interview/question-templates/by-role/'
    );

    const response = await GET(request, {
      params: { role: '' },
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid role parameter');
  });

  it('should return questions for a role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const { getQuestionsByRole } = await import(
      '@/features/interview/question-bank-service'
    );

    const mockQuestions = [
      {
        id: '1',
        text: 'Tell me about yourself',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
        rubric: null,
      },
      {
        id: '2',
        text: 'Design a system',
        targetRole: 'Software Engineer',
        category: 'Technical',
        difficulty: 'hard' as const,
        estimatedTime: 300,
        rubric: null,
      },
    ];

    vi.mocked(getQuestionsByRole).mockResolvedValue(mockQuestions);

    const request = new NextRequest(
      'http://localhost:3000/api/interview/question-templates/by-role/Software%20Engineer'
    );

    const response = await GET(request, {
      params: { role: 'Software Engineer' },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.role).toBe('Software Engineer');
    expect(data.questions).toEqual(mockQuestions);
    expect(data.count).toBe(2);
  });

  it('should return 404 if no questions found for role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const { getQuestionsByRole } = await import(
      '@/features/interview/question-bank-service'
    );

    vi.mocked(getQuestionsByRole).mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/interview/question-templates/by-role/NonExistentRole'
    );

    const response = await GET(request, {
      params: { role: 'NonExistentRole' },
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('No questions found');
  });

  it('should handle service errors', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const { getQuestionsByRole } = await import(
      '@/features/interview/question-bank-service'
    );

    const error = new Error('Database error');
    vi.mocked(getQuestionsByRole).mockRejectedValue(error);

    const request = new NextRequest(
      'http://localhost:3000/api/interview/question-templates/by-role/Software%20Engineer'
    );

    const response = await GET(request, {
      params: { role: 'Software Engineer' },
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch questions for role');
  });
});
