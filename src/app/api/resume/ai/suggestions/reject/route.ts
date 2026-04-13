/**
 * POST /api/resume/ai/suggestions/reject
 * Reject suggestions without applying them
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

const logger = new Logger('SuggestionsRejectAPI');

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { resumeId, suggestionIds } = body;

    if (!resumeId || !Array.isArray(suggestionIds) || suggestionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid resumeId or suggestionIds' },
        { status: 400 }
      );
    }

    // Verify resume ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume || resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get suggestions to reject
    const suggestions = await prisma.resumeSuggestion.findMany({
      where: {
        id: { in: suggestionIds },
        resumeId,
        status: 'pending',
      },
    });

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: 'No pending suggestions found' },
        { status: 404 }
      );
    }

    // Update suggestion status to rejected
    const result = await prisma.resumeSuggestion.updateMany({
      where: {
        id: { in: suggestionIds },
        resumeId,
        status: 'pending',
      },
      data: {
        status: 'rejected',
      },
    });

    logger.info(`Rejected ${result.count} suggestions for resume ${resumeId}`);

    return NextResponse.json(
      {
        rejectedCount: result.count,
        message: `Successfully rejected ${result.count} suggestions`,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error rejecting suggestions', error);
    return NextResponse.json(
      { error: 'Failed to reject suggestions' },
      { status: 500 }
    );
  }
}
