/**
 * GET /api/resume/discovery/search
 * Search published resumes
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/logger';
import { searchPublishedResumes } from '@/services/publishing/publishing-service';

const logger = new Logger('DiscoverySearchAPI');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = searchParams.get('q') || undefined;
    const skillsParam = searchParams.get('skills');
    const rolesParam = searchParams.get('roles');
    const industriesParam = searchParams.get('industries');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate pagination
    if (limit < 1 || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Parse array parameters
    const skills = skillsParam ? skillsParam.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    const roles = rolesParam ? rolesParam.split(',').map(r => r.trim()).filter(Boolean) : undefined;
    const industries = industriesParam ? industriesParam.split(',').map(i => i.trim()).filter(Boolean) : undefined;

    // Validate filters
    if (skills && skills.length > 20) {
      return NextResponse.json(
        { error: 'Too many skills filters (max 20)' },
        { status: 400 }
      );
    }

    if (roles && roles.length > 20) {
      return NextResponse.json(
        { error: 'Too many role filters (max 20)' },
        { status: 400 }
      );
    }

    if (industries && industries.length > 20) {
      return NextResponse.json(
        { error: 'Too many industry filters (max 20)' },
        { status: 400 }
      );
    }

    // Search published resumes
    const results = await searchPublishedResumes(
      query,
      skills,
      roles,
      industries,
      limit,
      offset
    );

    logger.info(`Discovery search performed: query=${query}, skills=${skills?.length || 0}, roles=${roles?.length || 0}`);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    logger.error('Error searching published resumes', error);
    return NextResponse.json(
      { error: 'Failed to search resumes' },
      { status: 500 }
    );
  }
}
