import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/guards';
import { AnalyticsService } from '@/features/resume/analytics-service';
import { prisma } from '@/lib/prisma';

const ViewersSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

/**
 * GET /api/resumes/{resumeId}/analytics/viewers
 * Get recent viewers with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const validated = ViewersSchema.parse({ limit, offset });

    // Get recent viewers
    const { viewers, total } = await AnalyticsService.getRecentViewers(
      params.resumeId,
      validated.limit,
      validated.offset
    );

    return NextResponse.json(
      {
        viewers,
        total,
        limit: validated.limit,
        offset: validated.offset,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', issues: error.issues },
        { status: 400 }
      );
    }
    console.error('Error retrieving viewers:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve viewers' },
      { status: 500 }
    );
  }
}
