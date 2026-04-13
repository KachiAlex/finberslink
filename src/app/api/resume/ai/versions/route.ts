/**
 * GET /api/resume/ai/versions - Get version history for a resume
 * POST /api/resume/ai/versions/compare - Compare two versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

const logger = new Logger('VersionsAPI');

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId');

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing resumeId parameter' },
        { status: 400 }
      );
    }

    // Verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume || resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get version history
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });

    return NextResponse.json(
      {
        versions,
        count: versions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error getting version history', error);
    return NextResponse.json(
      { error: 'Failed to retrieve version history' },
      { status: 500 }
    );
  }
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
    const body = await request.json();
    const { resumeId, versionId1, versionId2 } = body;

    if (!resumeId || !versionId1 || !versionId2) {
      return NextResponse.json(
        { error: 'Missing resumeId, versionId1, or versionId2' },
        { status: 400 }
      );
    }

    // Verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume || resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get both versions
    const version1 = await prisma.resumeVersion.findUnique({
      where: { id: versionId1 },
    });

    const version2 = await prisma.resumeVersion.findUnique({
      where: { id: versionId2 },
    });

    if (!version1 || !version2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      );
    }

    if (version1.resumeId !== resumeId || version2.resumeId !== resumeId) {
      return NextResponse.json(
        { error: 'Versions do not belong to this resume' },
        { status: 400 }
      );
    }

    // Compare versions
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }> = [];

    // Compare top-level fields
    const fields = ['title', 'summary', 'skills', 'location'];
    for (const field of fields) {
      const oldValue = version1.snapshotData[field];
      const newValue = version2.snapshotData[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue,
        });
      }
    }

    // Compare nested arrays
    const arrayFields = ['experiences', 'education', 'projects'];
    for (const field of arrayFields) {
      const oldValue = version1.snapshotData[field] || [];
      const newValue = version2.snapshotData[field] || [];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue,
        });
      }
    }

    logger.info(`Compared versions ${versionId1} and ${versionId2} for resume ${resumeId}`);

    return NextResponse.json(
      {
        versionId1,
        versionId2,
        changes,
        changeCount: changes.length,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error comparing versions', error);
    return NextResponse.json(
      { error: 'Failed to compare versions' },
      { status: 500 }
    );
  }
}
