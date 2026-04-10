import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getQuestionsByRole } from '@/features/interview/question-bank-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = params;

    if (!role || typeof role !== 'string') {
      return NextResponse.json({ error: 'Invalid role parameter' }, { status: 400 });
    }

    const questions = await getQuestionsByRole(role);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: `No questions found for role: ${role}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      role,
      questions,
      count: questions.length,
    });
  } catch (error) {
    console.error(`Error fetching questions for role ${params.role}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch questions for role' },
      { status: 500 }
    );
  }
}
