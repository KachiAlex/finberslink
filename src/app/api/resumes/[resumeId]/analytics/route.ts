import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { AnalyticsService } from '@/features/resume/analytics-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/resumes/{resumeId}/analytics
 * Get analytics data for a resume
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { resumeId } = await params;

    // Verify resume belongs to user
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get analytics
    const analytics = await AnalyticsService.getAnalytics(params.resumeId);

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error('Error retrieving analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}
