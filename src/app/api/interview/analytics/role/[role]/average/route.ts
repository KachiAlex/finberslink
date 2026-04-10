import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../auth/[...nextauth]/route';
import { getRoleAverageScore } from '../../../../../../features/interview/analytics-service';

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

    const averageScore = await getRoleAverageScore(role);

    return NextResponse.json({
      role,
      averageScore,
    });
  } catch (error) {
    console.error('Error fetching role average score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role average score' },
      { status: 500 }
    );
  }
}
