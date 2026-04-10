import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { SharingService } from '@/features/resume/sharing-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/resumes/{resumeId}/share-links
 * Get all share links for a resume with view counts and summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeId } = params;

    // Verify resume belongs to user
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get share links
    const shareLinks = await SharingService.getShareLinks(resumeId);

    // Get summary
    const summary = await SharingService.getShareSummary(resumeId);

    // Enrich share links with remaining time
    const enrichedLinks = shareLinks.map(link => ({
      ...link,
      remainingTime: SharingService.getRemainingTime(link.expiresAt),
      status: link.revokedAt ? 'revoked' : new Date() > link.expiresAt ? 'expired' : 'active',
    }));

    return NextResponse.json({
      shareLinks: enrichedLinks,
      summary,
    });
  } catch (error) {
    console.error('Error fetching share links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resumes/{resumeId}/share-links
 * Create new share links for a resume
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
  try {
    const session = await requireSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeId } = params;
    const body = await request.json();

    // Verify resume belongs to user
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate request body
    const { recipients, expirationDays, message } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (recipients.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 recipients per request' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: `Invalid email address: ${email}` },
          { status: 400 }
        );
      }
    }

    // Create share links
    const shareLinks = await SharingService.createShareLink(
      resumeId,
      session.user.id,
      recipients,
      expirationDays,
      message
    );

    return NextResponse.json({
      shareLinks,
      emailsSent: shareLinks.length,
    });
  } catch (error) {
    console.error('Error creating share links:', error);
    return NextResponse.json(
      { error: 'Failed to create share links' },
      { status: 500 }
    );
  }
}
