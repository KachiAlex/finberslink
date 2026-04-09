import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/guards';
import { VersioningService } from '@/features/resume/versioning-service';
import { prisma } from '@/lib/prisma';

const RestoreSchema = z.object({
  changeDescription: z.string().optional(),
});

/**
 * POST /api/resumes/{resumeId}/versions/{versionId}/restore
 * Restore a previous version of a resume
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { resumeId: string; versionId: string } }
) {
  try {
    const session = requireAuth(request);
    const body = await request.json();
    const validated = RestoreSchema.parse(body);

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

    // Restore version
    await VersioningService.restoreVersion(
      params.resumeId,
      params.versionId,
      session.userId
    );

    // Get the new version created during restoration
    const versions = await VersioningService.getVersionHistory(params.resumeId);
    const newVersionId = versions[0]?.id;

    return NextResponse.json(
      {
        success: true,
        newVersionId,
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
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}
