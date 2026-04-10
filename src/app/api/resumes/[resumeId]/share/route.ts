import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/guards';
import { SharingService } from '@/features/resume/sharing-service';
import { prisma } from '@/lib/prisma';
import { createRateLimit, rateLimitPresets } from '@/lib/security/rate-limit';

const ShareSchema = z.object({
  recipients: z.array(z.string().email()).min(1).max(50),
  expirationDays: z.number().int().positive().max(365).optional(),
  message: z.string().optional(),
});

// Rate limit: 50 share creations per hour per user
const shareRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50,
  message: 'Too many share requests. Please try again later.',
});

/**
 * POST /api/resumes/{resumeId}/share
 * Create share links for a resume
 */
export const POST = shareRateLimit(async (
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) => {
  try {
    const session = requireAuth(request);
    const body = await request.json();
    const validated = ShareSchema.parse(body);

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

    // Create share links
    const shareLinks = await SharingService.createShareLink(
      params.resumeId,
      session.userId,
      validated.recipients,
      validated.expirationDays
    );

    // TODO: Send emails to recipients with share links

    return NextResponse.json(
      {
        shareLinks,
        emailsSent: validated.recipients.length,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', issues: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/resumes/{resumeId}/share
 * Get all share links for a resume
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

    // Get share links
    const shareLinks = await SharingService.getShareLinks(params.resumeId);

    // Get summary
    const summary = await SharingService.getShareSummary(params.resumeId);

    return NextResponse.json(
      {
        shareLinks,
        summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving share links:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve share links' },
      { status: 500 }
    );
  }
}
