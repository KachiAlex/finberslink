import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { getUserAnalytics } from '@/features/interview/analytics-service';

export async function GET(request: Request) {
  try {
    const session = requireAuth(request as any);
    if (!session?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await getUserAnalytics(session.sub);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}
