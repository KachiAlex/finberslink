import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { AnalyticsService } from '@/features/resume/analytics-service';
import { prisma } from '@/lib/prisma';
import { createRateLimit } from '@/lib/security/rate-limit';

// Rate limit: 100 analytics queries per hour per user
const analyticsRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,
  message: 'Too many analytics requests. Please try again later.',
});

/**
 * GET /api/resumes/{resumeId}/analytics
 * Get analytics data for a resume
 */
export const GET = analyticsRateLimit(async (
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) => {
  try {
    const session = requireAuth(request);

    // Verify resume belongs to user
    const resume = await prisma.resume.findUnique({
      where: { id: params.resumeId },
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
});
