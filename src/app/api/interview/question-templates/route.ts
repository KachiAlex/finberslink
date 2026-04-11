import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  getQuestionTemplates,
  createQuestionTemplate,
  getAvailableRoles,
  getAvailableCategories,
} from '@/features/interview/question-bank-service';

const createTemplateSchema = z.object({
  text: z.string().min(10, 'Question must be at least 10 characters'),
  targetRole: z.string().min(1, 'Target role is required'),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedTime: z.number().int().min(30, 'Estimated time must be at least 30 seconds'),
  rubric: z.string().optional(),
  followUpQuestions: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    if (!session?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') || undefined;
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const templates = await getQuestionTemplates({
      role,
      category,
      difficulty,
      page,
      limit,
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching question templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await createQuestionTemplate({
      text: validatedData.text,
      targetRole: validatedData.targetRole,
      category: validatedData.category,
      difficulty: validatedData.difficulty,
      estimatedTime: validatedData.estimatedTime,
      rubric: validatedData.rubric,
      followUpQuestions: validatedData.followUpQuestions,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating question template:', error);
    return NextResponse.json(
      { error: 'Failed to create question template' },
      { status: 500 }
    );
  }
}
