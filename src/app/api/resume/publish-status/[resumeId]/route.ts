/**
 * GET /api/resume/publish-status/:resumeId
 * Get publication status for a resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Logger } from '@/lib/logger';
import { getPublicationStatus } from '@/services/publishing/publishing-service';

const logger = new Logger('PublishStatusAPI');

export async function GET(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { resumeId } = params;

    if (!resumeId || typeof resumeId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid resumeId' },
        { status: 400 }
      );
    }

    // Get publication status
    let status;
    try {
      status = await getPublicationStatus(resumeId, session.user.id);
    } catch (error: any) {
      if (error.message === 'Resume not found') {
        return NextResponse.json(
          { error: 'Resume not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied: You do not own this resume' },
          { status: 403 }
        );
      }
      throw error;
    }

    logger.info(`Publication status retrieved: ${resumeId}`);

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    logger.error('Error getting publication status', error);
    return NextResponse.json(
      { error: 'Failed to retrieve publication status' },
      { status: 500 }
    );
  }
}
