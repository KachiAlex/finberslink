/**
 * POST /api/resume/ai/suggestions
 * Generate AI suggestions for a resume
 * 
 * GET /api/resume/ai/suggestions
 * Get pending suggestions for a resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { generateSuggestions, saveSuggestions, getPendingSuggestions } from '@/services/ai/suggestion-service';

const logger = new Logger('SuggestionsAPI');

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
    const { resumeId, analysisType = 'full' } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing resumeId' },
        { status: 400 }
      );
    }

    if (!['full', 'summary', 'achievements', 'skills', 'experience'].includes(analysisType)) {
      return NextResponse.json(
        { error: 'Invalid analysisType' },
        { status: 400 }
      );
    }

    // Get resume with all data
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        user: true,
        experiences: true,
        education: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate resume has sufficient content
    if (!resume.summary && (!resume.experiences || resume.experiences.length === 0)) {
      return NextResponse.json(
        { error: 'Resume needs more content for meaningful suggestions' },
        { status: 400 }
      );
    }

    // Generate suggestions
    const result = await generateSuggestions(
      resumeId,
      session.user.id,
      {
        summary: resume.summary || undefined,
        experiences: resume.experiences?.map(e => ({
          title: e.title,
          company: e.company,
          description: e.description || undefined,
          achievements: e.achievements ? (Array.isArray(e.achievements) ? e.achievements : []) : undefined,
        })),
        education: resume.education?.map(e => ({
          school: e.school,
          degree: e.degree || '',
          field: e.field || '',
        })),
        skills: resume.skills || undefined,
      },
      analysisType as any
    );

    // Save suggestions to database
    await saveSuggestions(resumeId, result.suggestions);

    logger.info(`Generated ${result.suggestions.length} suggestions for resume ${resumeId}`);

    return NextResponse.json(
      {
        suggestions: result.suggestions,
        analysisMetadata: result.analysisMetadata,
        count: result.suggestions.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error generating suggestions', error);

    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Maximum 10 suggestions per hour.' },
        { status: 429 }
      );
    }

    if (error.message?.includes('API')) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

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

    // Get pending suggestions
    const suggestions = await getPendingSuggestions(resumeId);

    return NextResponse.json(
      {
        suggestions,
        count: suggestions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error getting suggestions', error);
    return NextResponse.json(
      { error: 'Failed to retrieve suggestions' },
      { status: 500 }
    );
  }
}
