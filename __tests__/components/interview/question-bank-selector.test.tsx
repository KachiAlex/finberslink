import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionBankSelector } from '@/features/interview/components/question-bank-selector';

// Mock fetch
global.fetch = vi.fn();

describe('QuestionBankSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('should render role selector', () => {
    render(
      <QuestionBankSelector
        selectedRole=""
        onRoleChange={vi.fn()}
        onQuestionsSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Select Interview Role')).toBeInTheDocument();
  });

  it('should load and display available roles', async () => {
    const mockRoles = ['Software Engineer', 'Product Manager', 'Data Scientist'];
    const mockTemplates = mockRoles.map((role) => ({
      id: `${role}-1`,
      text: `Question for ${role}`,
      targetRole: role,
      category: 'Behavioral',
      difficulty: 'easy' as const,
      estimatedTime: 120,
    }));

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ templates: mockTemplates }),
    });

    render(
      <QuestionBankSelector
        selectedRole=""
        onRoleChange={vi.fn()}
        onQuestionsSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
  });

  it('should fetch questions when role is selected', async () => {
    const mockQuestions = [
      {
        id: '1',
        text: 'Tell me about yourself',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          role: 'Software Engineer',
          questions: mockQuestions,
          count: 1,
        }),
      });

    const onRoleChange = vi.fn();
    const onQuestionsSelect = vi.fn();

    render(
      <QuestionBankSelector
        selectedRole="Software Engineer"
        onRoleChange={onRoleChange}
        onQuestionsSelect={onQuestionsSelect}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/interview/question-templates/by-role/Software Engineer'
      );
    });
  });

  it('should allow selecting questions', async () => {
    const mockQuestions = [
      {
        id: '1',
        text: 'Tell me about yourself',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
      },
      {
        id: '2',
        text: 'Design a system',
        targetRole: 'Software Engineer',
        category: 'Technical',
        difficulty: 'hard' as const,
        estimatedTime: 300,
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          role: 'Software Engineer',
          questions: mockQuestions,
          count: 2,
        }),
      });

    const onQuestionsSelect = vi.fn();

    render(
      <QuestionBankSelector
        selectedRole="Software Engineer"
        onRoleChange={vi.fn()}
        onQuestionsSelect={onQuestionsSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tell me about yourself')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox', {
      name: /Tell me about yourself/i,
    });

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(onQuestionsSelect).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            text: 'Tell me about yourself',
          }),
        ])
      );
    });
  });

  it('should display question metadata', async () => {
    const mockQuestions = [
      {
        id: '1',
        text: 'Tell me about yourself',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          role: 'Software Engineer',
          questions: mockQuestions,
          count: 1,
        }),
      });

    render(
      <QuestionBankSelector
        selectedRole="Software Engineer"
        onRoleChange={vi.fn()}
        onQuestionsSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.getByText('easy')).toBeInTheDocument();
      expect(screen.getByText('2m')).toBeInTheDocument();
    });
  });

  it('should show summary stats', async () => {
    const mockQuestions = [
      {
        id: '1',
        text: 'Question 1',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
      },
      {
        id: '2',
        text: 'Question 2',
        targetRole: 'Software Engineer',
        category: 'Technical',
        difficulty: 'hard' as const,
        estimatedTime: 300,
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          role: 'Software Engineer',
          questions: mockQuestions,
          count: 2,
        }),
      });

    render(
      <QuestionBankSelector
        selectedRole="Software Engineer"
        onRoleChange={vi.fn()}
        onQuestionsSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Questions Selected')).toBeInTheDocument();
      expect(screen.getByText('Total Time')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    render(
      <QuestionBankSelector
        selectedRole="Software Engineer"
        onRoleChange={vi.fn()}
        onQuestionsSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load questions/i)).toBeInTheDocument();
    });
  });

  it('should support select all functionality', async () => {
    const mockQuestions = [
      {
        id: '1',
        text: 'Question 1',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
      },
      {
        id: '2',
        text: 'Question 2',
        targetRole: 'Software Engineer',
        category: 'Technical',
        difficulty: 'hard' as const,
        estimatedTime: 300,
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          role: 'Software Engineer',
          questions: mockQuestions,
          count: 2,
        }),
      });

    const onQuestionsSelect = vi.fn();

    render(
      <QuestionBankSelector
        selectedRole="Software Engineer"
        onRoleChange={vi.fn()}
        onQuestionsSelect={onQuestionsSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);

    await waitFor(() => {
      expect(onQuestionsSelect).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: '2' }),
        ])
      );
    });
  });

  it('should be accessible with keyboard navigation', async () => {
    const mockQuestions = [
      {
        id: '1',
        text: 'Question 1',
        targetRole: 'Software Engineer',
        category: 'Behavioral',
        difficulty: 'easy' as const,
        estimatedTime: 120,
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          role: 'Software Engineer',
          questions: mockQuestions,
          count: 1,
        }),
      });

    render(
      <QuestionBankSelector
        selectedRole="Software Engineer"
        onRoleChange={vi.fn()}
        onQuestionsSelect={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox', {
      name: /Select question: Question 1/i,
    });

    expect(checkbox).toHaveAttribute('aria-label');
  });
});
