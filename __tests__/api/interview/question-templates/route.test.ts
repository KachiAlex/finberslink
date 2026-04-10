import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/interview/question-templates/route';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('next-auth/next');
vi.mock('@/lib/prisma');

describe('GET /api/interview/question-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/interview/question-templates');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return question templates', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTemplates = [
      {
        id: '1',
        text: 'Question 1',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy',
        estimatedTime: 120,
        rubric: null,
      },
    ];

    vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue(mockTemplates);
    vi.mocked(prisma.questionTemplate.count).mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/interview/question-templates');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.templates).toEqual(mockTemplates);
  });

  it('should filter by role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue([]);
    vi.mocked(prisma.questionTemplate.count).mockResolvedValue(0);

    const request = new NextRequest(
      'http://localhost:3000/api/interview/question-templates?role=Software%20Engineer'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.questionTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          targetRole: 'Software Engineer',
        }),
      })
    );
  });

  it('should support pagination', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.questionTemplate.findMany).mockResolvedValue([]);
    vi.mocked(prisma.questionTemplate.count).mockResolvedValue(100);

    const request = new NextRequest(
      'http://localhost:3000/api/interview/question-templates?page=2&limit=10'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.questionTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });
});

describe('POST /api/interview/question-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/interview/question-templates', {
      method: 'POST',
      body: JSON.stringify({
        text: 'New question',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy',
        estimatedTime: 120,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'USER',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/interview/question-templates', {
      method: 'POST',
      body: JSON.stringify({
        text: 'New question',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy',
        estimatedTime: 120,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('Admin access required');
  });

  it('should create a new question template', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    } as any);

    const mockCreated = {
      id: 'new-id',
      text: 'New question',
      targetRole: 'Software Engineer',
      category: 'Behavioral',
      difficulty: 'easy',
      estimatedTime: 120,
      rubric: null,
      followUpQuestions: null,
    };

    vi.mocked(prisma.questionTemplate.create).mockResolvedValue(mockCreated);

    const request = new NextRequest('http://localhost:3000/api/interview/question-templates', {
      method: 'POST',
      body: JSON.stringify({
        text: 'New question',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy',
        estimatedTime: 120,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe('new-id');
  });

  it('should validate required fields', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/interview/question-templates', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Short',
        targetRole: '',
        category: 'Behavioral',
        difficulty: 'easy',
        estimatedTime: 120,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation error');
  });

  it('should validate difficulty enum', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/interview/question-templates', {
      method: 'POST',
      body: JSON.stringify({
        text: 'New question',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'invalid',
        estimatedTime: 120,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should validate minimum estimated time', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/interview/question-templates', {
      method: 'POST',
      body: JSON.stringify({
        text: 'New question',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy',
        estimatedTime: 10,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
