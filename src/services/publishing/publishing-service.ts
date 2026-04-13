/**
 * Publishing Service
 * 
 * Handles resume publication, unpublication, and public access management.
 * Manages public URLs, publication status, and view tracking.
 */

import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('PublishingService');

export interface PublishingStatus {
  published: boolean;
  publicUrl?: string;
  publicId?: string;
  publishedAt?: Date;
  viewCount: number;
}

export interface PublishedResumePreview {
  publicId: string;
  publicUrl: string;
  publisherName: string;
  publishedAt: Date;
  viewCount: number;
  summary?: string;
  skills: string[];
  targetRoles: string[];
  targetIndustry?: string;
}

/**
 * Generate a unique public ID for a resume
 */
export function generatePublicId(): string {
  return uuidv4();
}

/**
 * Publish a resume
 */
export async function publishResume(resumeId: string, userId: string): Promise<PublishingStatus> {
  try {
    // Verify resume exists and user owns it
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true, id: true },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new Error('Access denied: You do not own this resume');
    }

    // Check if already published
    const existing = await prisma.resumePublishing.findUnique({
      where: { resumeId },
    });

    if (existing?.published) {
      throw new Error('Resume is already published');
    }

    // Generate public ID if not exists
    const publicId = existing?.publicId || generatePublicId();

    // Update or create publishing record
    const publishing = await prisma.resumePublishing.upsert({
      where: { resumeId },
      update: {
        published: true,
        publishedAt: new Date(),
        unpublishedAt: null,
      },
      create: {
        resumeId,
        publicId,
        published: true,
        publishedAt: new Date(),
      },
    });

    logger.info(`Resume published: ${resumeId} with publicId: ${publishing.publicId}`);

    return {
      published: true,
      publicUrl: `/public/resumes/${publishing.publicId}`,
      publicId: publishing.publicId,
      publishedAt: publishing.publishedAt || undefined,
      viewCount: publishing.viewCount,
    };
  } catch (error) {
    logger.error('Error publishing resume', error);
    throw error;
  }
}

/**
 * Unpublish a resume
 */
export async function unpublishResume(resumeId: string, userId: string): Promise<PublishingStatus> {
  try {
    // Verify resume exists and user owns it
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new Error('Access denied: You do not own this resume');
    }

    // Update publishing record
    const publishing = await prisma.resumePublishing.update({
      where: { resumeId },
      data: {
        published: false,
        unpublishedAt: new Date(),
      },
    });

    logger.info(`Resume unpublished: ${resumeId}`);

    return {
      published: false,
      viewCount: publishing.viewCount,
    };
  } catch (error) {
    logger.error('Error unpublishing resume', error);
    throw error;
  }
}

/**
 * Get publication status for a resume
 */
export async function getPublicationStatus(resumeId: string, userId: string): Promise<PublishingStatus> {
  try {
    // Verify resume exists and user owns it
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new Error('Access denied: You do not own this resume');
    }

    // Get publishing record
    const publishing = await prisma.resumePublishing.findUnique({
      where: { resumeId },
    });

    if (!publishing) {
      return {
        published: false,
        viewCount: 0,
      };
    }

    return {
      published: publishing.published,
      publicUrl: publishing.published ? `/public/resumes/${publishing.publicId}` : undefined,
      publicId: publishing.publicId,
      publishedAt: publishing.publishedAt || undefined,
      viewCount: publishing.viewCount,
    };
  } catch (error) {
    logger.error('Error getting publication status', error);
    throw error;
  }
}

/**
 * Get published resume by public ID (no authentication required)
 */
export async function getPublishedResume(publicId: string) {
  try {
    // Get publishing record
    const publishing = await prisma.resumePublishing.findUnique({
      where: { publicId },
      include: {
        resume: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            experiences: true,
            education: true,
            projects: true,
          },
        },
      },
    });

    if (!publishing || !publishing.published) {
      return null;
    }

    return {
      resume: publishing.resume,
      publisherName: `${publishing.resume.user.firstName} ${publishing.resume.user.lastName}`,
      publishedAt: publishing.publishedAt,
      viewCount: publishing.viewCount,
    };
  } catch (error) {
    logger.error('Error getting published resume', error);
    throw error;
  }
}

/**
 * Record a view for a published resume
 */
export async function recordPublicResumeView(publicId: string, metadata?: Record<string, any>): Promise<void> {
  try {
    // Get publishing record
    const publishing = await prisma.resumePublishing.findUnique({
      where: { publicId },
    });

    if (!publishing || !publishing.published) {
      throw new Error('Resume not found or not published');
    }

    // Record view event
    const { recordAnalyticsEvent } = await import('@/services/analytics/analytics-service');
    await recordAnalyticsEvent({
      resumeId: publishing.resumeId,
      eventType: 'view',
      ...metadata,
    });

    // Update view count and last viewed timestamp
    await prisma.resumePublishing.update({
      where: { publicId },
      data: {
        viewCount: {
          increment: 1,
        },
        lastViewedAt: new Date(),
      },
    });

    logger.info(`Public resume view recorded: ${publicId}`);
  } catch (error) {
    logger.error('Error recording public resume view', error);
    throw error;
  }
}

/**
 * Search published resumes
 */
export async function searchPublishedResumes(
  query?: string,
  skills?: string[],
  roles?: string[],
  industries?: string[],
  limit: number = 20,
  offset: number = 0
) {
  try {
    const whereClause: any = {
      published: true,
    };

    // Build search conditions
    if (query) {
      whereClause.OR = [
        {
          resume: {
            summary: {
              search: query,
            },
          },
        },
        {
          resume: {
            title: {
              search: query,
            },
          },
        },
      ];
    }

    if (skills && skills.length > 0) {
      whereClause.resume = {
        ...whereClause.resume,
        skills: {
          hasSome: skills,
        },
      };
    }

    if (roles && roles.length > 0) {
      whereClause.resume = {
        ...whereClause.resume,
        targetRoles: {
          hasSome: roles,
        },
      };
    }

    if (industries && industries.length > 0) {
      whereClause.resume = {
        ...whereClause.resume,
        targetIndustry: {
          in: industries,
        },
      };
    }

    // Get total count
    const total = await prisma.resumePublishing.count({
      where: whereClause,
    });

    // Get paginated results
    const results = await prisma.resumePublishing.findMany({
      where: whereClause,
      include: {
        resume: {
          select: {
            summary: true,
            skills: true,
            targetRoles: true,
            targetIndustry: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const previews: PublishedResumePreview[] = results.map(r => ({
      publicId: r.publicId,
      publicUrl: `/public/resumes/${r.publicId}`,
      publisherName: `${r.resume.user.firstName} ${r.resume.user.lastName}`,
      publishedAt: r.publishedAt!,
      viewCount: r.viewCount,
      summary: r.resume.summary || undefined,
      skills: r.resume.skills,
      targetRoles: r.resume.targetRoles,
      targetIndustry: r.resume.targetIndustry || undefined,
    }));

    return {
      results: previews,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    logger.error('Error searching published resumes', error);
    throw error;
  }
}
