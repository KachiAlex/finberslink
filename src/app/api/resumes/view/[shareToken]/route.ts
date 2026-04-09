import { NextRequest, NextResponse } from 'next/server';
import { SharingService } from '@/features/resume/sharing-service';
import { AnalyticsService } from '@/features/resume/analytics-service';
import { NotificationService } from '@/features/resume/notification-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/resumes/view/{shareToken}
 * Public endpoint to view shared resume
 * No authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    // Validate share token
    const isValid = await SharingService.validateShareToken(params.shareToken);

    if (!isValid) {
      return NextResponse.json(
        { error: 'This resume link has expired or is no longer available' },
        { status: 403 }
      );
    }

    // Get share link details
    const shareLink = await SharingService.getShareLinkDetails(params.shareToken);

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    // Get resume data
    const resume = await prisma.resume.findUnique({
      where: { id: shareLink.resumeId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        experiences: { orderBy: { order: 'asc' } },
        projects: { orderBy: { order: 'asc' } },
        education: { orderBy: { order: 'asc' } },
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Record view asynchronously (fire and forget)
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

    Promise.all([
      SharingService.recordShareLinkView(params.shareToken),
      AnalyticsService.recordView(shareLink.resumeId, params.shareToken, {
        userAgent,
        ipAddress,
        viewerEmail: shareLink.recipientEmail,
      }),
      NotificationService.createNotification(shareLink.resumeId, {
        type: 'view',
        viewerEmail: shareLink.recipientEmail,
      }),
    ]).catch(error => {
      console.error('Error recording view analytics:', error);
    });

    return NextResponse.json(
      {
        id: resume.id,
        title: resume.title,
        summary: resume.summary,
        skills: resume.skills,
        location: resume.location,
        template: resume.template,
        headshotUrl: resume.headshotUrl,
        user: resume.user,
        experiences: resume.experiences,
        projects: resume.projects,
        education: resume.education,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving shared resume:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve resume' },
      { status: 500 }
    );
  }
}
