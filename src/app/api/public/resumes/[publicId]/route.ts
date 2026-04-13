/**
 * GET /api/public/resumes/:publicId
 * Get a published resume (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/logger';
import { getPublishedResume, recordPublicResumeView } from '@/services/publishing/publishing-service';

const logger = new Logger('PublicResumeAPI');

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params;

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid publicId' },
        { status: 400 }
      );
    }

    // Get published resume
    const resumeData = await getPublishedResume(publicId);

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume not found or not published' },
        { status: 404 }
      );
    }

    // Record view event
    try {
      const userAgent = request.headers.get('user-agent') || undefined;
      await recordPublicResumeView(publicId, {
        deviceType: userAgent?.includes('Mobile') ? 'mobile' : 'desktop',
        browser: extractBrowser(userAgent),
        operatingSystem: extractOS(userAgent),
      });
    } catch (error) {
      logger.warn('Failed to record public resume view', error);
      // Don't fail the request if view recording fails
    }

    logger.info(`Public resume accessed: ${publicId}`);

    return NextResponse.json(resumeData, { status: 200 });
  } catch (error) {
    logger.error('Error getting public resume', error);
    return NextResponse.json(
      { error: 'Failed to retrieve resume' },
      { status: 500 }
    );
  }
}

/**
 * Extract browser from user agent
 */
function extractBrowser(userAgent?: string): string | undefined {
  if (!userAgent) return undefined;

  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';

  return undefined;
}

/**
 * Extract OS from user agent
 */
function extractOS(userAgent?: string): string | undefined {
  if (!userAgent) return undefined;

  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  if (userAgent.includes('Android')) return 'Android';

  return undefined;
}
