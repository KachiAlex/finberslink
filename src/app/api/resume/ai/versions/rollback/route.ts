/**
 * POST /api/resume/ai/versions/rollback
 * Rollback resume to a previous version
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

const logger = new Logger('VersionRollbackAPI');

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
    const { resumeId, versionId } = body;

    if (!resumeId || !versionId) {
      return NextResponse.json(
        { error: 'Missing resumeId or versionId' },
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

    // Get the version to rollback to
    const version = await prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.resumeId !== resumeId) {
      return NextResponse.json(
        { error: 'Version not found or does not belong to this resume' },
        { status: 404 }
      );
    }

    const snapshotData = version.snapshotData;

    // Create a new version snapshot before rollback
    const currentResume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        experiences: true,
        education: true,
        projects: true,
      },
    });

    const lastVersion = await prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

    const preRollbackSnapshot = await prisma.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: nextVersionNumber,
        snapshotData: {
          id: currentResume?.id,
          title: currentResume?.title,
          summary: currentResume?.summary,
          skills: currentResume?.skills,
          location: currentResume?.location,
          experiences: currentResume?.experiences,
          education: currentResume?.education,
          projects: currentResume?.projects,
        },
      },
    });

    // Update resume with snapshot data
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        title: snapshotData.title,
        summary: snapshotData.summary,
        skills: snapshotData.skills,
        location: snapshotData.location,
      },
    });

    // Update experiences
    if (snapshotData.experiences) {
      // Delete current experiences
      await prisma.resumeExperience.deleteMany({ where: { resumeId } });

      // Create experiences from snapshot
      for (const exp of snapshotData.experiences) {
        await prisma.resumeExperience.create({
          data: {
            resumeId,
            company: exp.company,
            role: exp.role,
            title: exp.title,
            startDate: exp.startDate ? new Date(exp.startDate) : undefined,
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            description: exp.description,
            achievements: exp.achievements,
            order: exp.order,
          },
        });
      }
    }

    // Update education
    if (snapshotData.education) {
      // Delete current education
      await prisma.resumeEducation.deleteMany({ where: { resumeId } });

      // Create education from snapshot
      for (const edu of snapshotData.education) {
        await prisma.resumeEducation.create({
          data: {
            resumeId,
            school: edu.school,
            degree: edu.degree,
            field: edu.field,
            summary: edu.summary,
            order: edu.order,
          },
        });
      }
    }

    // Update projects
    if (snapshotData.projects) {
      // Delete current projects
      await prisma.resumeProject.deleteMany({ where: { resumeId } });

      // Create projects from snapshot
      for (const proj of snapshotData.projects) {
        await prisma.resumeProject.create({
          data: {
            resumeId,
            name: proj.name,
            summary: proj.summary,
            link: proj.link,
            techStack: proj.techStack,
            order: proj.order,
          },
        });
      }
    }

    logger.info(`Rolled back resume ${resumeId} to version ${versionId}`);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully rolled back to version ${version.versionNumber}`,
        newVersionId: preRollbackSnapshot.id,
        newVersionNumber: preRollbackSnapshot.versionNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error rolling back version', error);
    return NextResponse.json(
      { error: 'Failed to rollback to version' },
      { status: 500 }
    );
  }
}
