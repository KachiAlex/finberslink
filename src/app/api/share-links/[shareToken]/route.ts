import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SharingService } from '@/features/resume/sharing-service';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

const ExtendSchema = z.object({
  additionalDays: z.number().int().positive().max(365),
});

/**
 * PATCH /api/share-links/{shareToken}/extend
 * Extend share link expiration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const session = requireAuth(request);
    const body = await request.json();
    const validated = ExtendSchema.parse(body);

    // Get share link
    const shareLink = await SharingService.getShareLinkDetails(params.shareToken);

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Verify user owns the resume
    const resume = await prisma.resume.findUnique({
      where: { id: shareLink.resumeId },
      select: { userId: true },
    });

    if (!resume || resume.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extend expiration
    const newExpiresAt = await SharingService.extendExpiration(
      params.shareToken,
      validated.additionalDays
    );

    return NextResponse.json(
      { newExpiresAt },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', issues: error.issues },
        { status: 400 }
      );
    }
    console.error('Error extending share link:', error);
    return NextResponse.json(
      { error: 'Failed to extend share link' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/share-links/{shareToken}
 * Revoke share link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const session = requireAuth(request);

    // Get share link
    const shareLink = await SharingService.getShareLinkDetails(params.shareToken);

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Verify user owns the resume
    const resume = await prisma.resume.findUnique({
      where: { id: shareLink.resumeId },
      select: { userId: true },
    });

    if (!resume || resume.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Revoke share link
    await SharingService.revokeShareLink(params.shareToken);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}
