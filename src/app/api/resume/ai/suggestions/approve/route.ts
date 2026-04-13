/**
 * POST /api/resume/ai/suggestions/approve
 * Approve and apply suggestions to a resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

const logger = new Logger('SuggestionsApproveAPI');

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
    const { resumeId, suggestionIds } = body;

    if (!resumeId || !Array.isArray(suggestionIds) || suggestionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid resumeId or suggestionIds' },
        { status: 400 }
      );
    }

    // Verify resume ownership
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

    // Get suggestions to approve
    const suggestions = await prisma.resumeSuggestion.findMany({
      where: {
        id: { in: suggestionIds },
        resumeId,
        status: 'pending',
      },
    });

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: 'No pending suggestions found' },
        { status: 404 }
      );
    }

    // Create version snapshot before applying changes
    const versionSnapshot = await prisma.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: (await prisma.resumeVersion.count({ where: { resumeId } })) + 1,
        snapshotData: {
          // Store complete resume state
          title: (await prisma.resume.findUnique({ where: { id: resumeId } }))?.title,
          summary: (await prisma.resume.findUnique({ where: { id: resumeId } }))?.summary,
          skills: (await prisma.resume.findUnique({ where: { id: resumeId } }))?.skills,
          experiences: await prisma.resumeExperience.findMany({ where: { resumeId } }),
          education: await prisma.resumeEducation.findMany({ where: { resumeId } }),
          projects: await prisma.resumeProject.findMany({ where: { resumeId } }),
        },
        createdAt: new Date(),
      },
    });

    // Apply approved suggestions
    let appliedCount = 0;

    for (const suggestion of suggestions) {
      try {
        // Update suggestion status
        await prisma.resumeSuggestion.update({
          where: { id: suggestion.id },
          data: {
            status: 'approved',
            appliedAt: new Date(),
          },
        });

        // Apply the suggestion based on target field
        if (suggestion.targetField === 'summary') {
          await prisma.resume.update({
            where: { id: resumeId },
            data: { summary: suggestion.suggestedText },
          });
        } else if (suggestion.targetField.startsWith('experience[')) {
          // Parse experience index and field
          const match = suggestion.targetField.match(/experience\[(\d+)\]\.(\w+)/);
          if (match) {
            const expIndex = parseInt(match[1]);
            const field = match[2];

            const experiences = await prisma.resumeExperience.findMany({
              where: { resumeId },
              orderBy: { order: 'asc' },
            });

            if (experiences[expIndex]) {
              if (field === 'description') {
                await prisma.resumeExperience.update({
                  where: { id: experiences[expIndex].id },
                  data: { description: suggestion.suggestedText },
                });
              } else if (field === 'achievements') {
                const currentAchievements = experiences[expIndex].achievements || [];
                const updatedAchievements = Array.isArray(currentAchievements)
                  ? [...currentAchievements, suggestion.suggestedText]
                  : [suggestion.suggestedText];

                await prisma.resumeExperience.update({
                  where: { id: experiences[expIndex].id },
                  data: { achievements: updatedAchievements },
                });
              }
            }
          }
        } else if (suggestion.targetField === 'skills') {
          const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
          const currentSkills = resume?.skills || [];
          const updatedSkills = [...currentSkills, suggestion.suggestedText];

          await prisma.resume.update({
            where: { id: resumeId },
            data: { skills: updatedSkills },
          });
        }

        appliedCount++;
      } catch (error) {
        logger.warn(`Failed to apply suggestion ${suggestion.id}`, error);
        // Continue with next suggestion
      }
    }

    logger.info(`Applied ${appliedCount} suggestions to resume ${resumeId}`);

    return NextResponse.json(
      {
        appliedCount,
        versionId: versionSnapshot.id,
        resumeUpdated: appliedCount > 0,
        message: `Successfully applied ${appliedCount} suggestions`,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error approving suggestions', error);
    return NextResponse.json(
      { error: 'Failed to approve suggestions' },
      { status: 500 }
    );
  }
}
