import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { SharingService } from '@/features/resume/sharing-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/share-links/{shareToken}
 * Get share link details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const { shareToken } = params;

    const shareLink = await SharingService.getShareLinkDetails(shareToken);

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...shareLink,
      remainingTime: SharingService.getRemainingTime(shareLink.expiresAt),
      status: shareLink.revokedAt ? 'revoked' : new Date() > shareLink.expiresAt ? 'expired' : 'active',
    });
  } catch (error) {
    console.error('Error fetching share link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share link' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/share-links/{shareToken}/extend
 * Extend share link expiration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shareToken } = params;
    const body = await request.json();

    // Verify share link belongs to user
    const shareLink = await prisma.resumeShareLink.findUnique({
      where: { shareToken },
      include: { resume: { select: { userId: true } } },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    if (shareLink.resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate request body
    const { additionalDays } = body;

    if (!additionalDays || typeof additionalDays !== 'number' || additionalDays <= 0) {
      return NextResponse.json(
        { error: 'additionalDays must be a positive number' },
        { status: 400 }
      );
    }

    if (additionalDays > 365) {
      return NextResponse.json(
        { error: 'Maximum extension is 365 days' },
        { status: 400 }
      );
    }

    // Extend expiration
    const newExpiresAt = await SharingService.extendExpiration(shareToken, additionalDays);

    return NextResponse.json({
      newExpiresAt,
      remainingTime: SharingService.getRemainingTime(newExpiresAt),
    });
  } catch (error) {
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
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shareToken } = params;

    // Verify share link belongs to user
    const shareLink = await prisma.resumeShareLink.findUnique({
      where: { shareToken },
      include: { resume: { select: { userId: true } } },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    if (shareLink.resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Revoke share link
    await SharingService.revokeShareLink(shareToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}
