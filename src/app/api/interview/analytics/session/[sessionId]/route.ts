import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { getSessionAnalytics } from '@/features/interview/analytics-service';
import { assertSessionOwnership } from '@/features/interview/service';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = requireAuth(request);
    if (!session?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Verify ownership
    await assertSessionOwnership(sessionId, session.sub);

    const analytics = await getSessionAnalytics(sessionId);

    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof Error && error.message === 'Interview session not found') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.error('Error fetching session analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session analytics' },
      { status: 500 }
    );
  }
}
