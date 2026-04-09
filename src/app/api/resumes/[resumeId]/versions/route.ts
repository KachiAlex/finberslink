import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { VersioningService } from '@/features/resume/versioning-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/resumes/{resumeId}/versions
 * Get version history for a resume
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

    // Get version history
    const versions = await VersioningService.getVersionHistory(params.resumeId);

    const total = versions.length;

    return NextResponse.json(
      {
        versions,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving version history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve version history' },
      { status: 500 }
    );
  }
}
