/**
 * POST /api/resume/publish
 * Publish or unpublish a resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Logger } from '@/lib/logger';
import { publishResume, unpublishResume } from '@/services/publishing/publishing-service';

const logger = new Logger('PublishAPI');

interface PublishRequest {
  resumeId: string;
  publish: boolean;
}

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
    let body: PublishRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request
    if (!body.resumeId || typeof body.resumeId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid resumeId' },
        { status: 400 }
      );
    }

    if (typeof body.publish !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid publish flag' },
        { status: 400 }
      );
    }

    // Publish or unpublish
    let result;
    try {
      if (body.publish) {
        result = await publishResume(body.resumeId, session.user.id);
      } else {
        result = await unpublishResume(body.resumeId, session.user.id);
      }
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
      if (error.message.includes('already published')) {
        return NextResponse.json(
          { error: 'Resume is already published' },
          { status: 409 }
        );
      }
      throw error;
    }

    logger.info(`Resume ${body.publish ? 'published' : 'unpublished'}: ${body.resumeId}`);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error('Error publishing/unpublishing resume', error);
    return NextResponse.json(
      { error: 'Failed to update publication status' },
      { status: 500 }
    );
  }
}
