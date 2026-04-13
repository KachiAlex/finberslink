/**
 * Version Snapshot Service
 * 
 * Manages resume version snapshots for tracking changes and enabling rollback.
 */

import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

const logger = new Logger('VersionService');

export interface VersionSnapshot {
  id: string;
  resumeId: string;
  versionNumber: number;
  snapshotData: Record<string, any>;
  createdAt: Date;
}

export interface VersionComparison {
  versionId1: string;
  versionId2: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

/**
 * Create a version snapshot
 */
export async function createVersionSnapshot(resumeId: string): Promise<VersionSnapshot> {
  try {
    // Get current resume state
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        experiences: true,
        education: true,
        projects: true,
      },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Get next version number
    const lastVersion = await prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

    // Create snapshot
    const snapshot = await prisma.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: nextVersionNumber,
        snapshotData: {
          id: resume.id,
          title: resume.title,
          summary: resume.summary,
          skills: resume.skills,
          location: resume.location,
          experiences: resume.experiences,
          education: resume.education,
          projects: resume.projects,
          createdAt: resume.createdAt,
          updatedAt: resume.updatedAt,
        },
      },
    });

    logger.info(`Created version snapshot ${snapshot.id} for resume ${resumeId}`);

    return {
      id: snapshot.id,
      resumeId: snapshot.resumeId,
      versionNumber: snapshot.versionNumber,
      snapshotData: snapshot.snapshotData as Record<string, any>,
      createdAt: snapshot.createdAt,
    };
  } catch (error) {
    logger.error('Error creating version snapshot', error);
    throw error;
  }
}

/**
 * Get version history for a resume
 */
export async function getVersionHistory(resumeId: string): Promise<VersionSnapshot[]> {
  try {
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });

    return versions.map(v => ({
      id: v.id,
      resumeId: v.resumeId,
      versionNumber: v.versionNumber,
      snapshotData: v.snapshotData as Record<string, any>,
      createdAt: v.createdAt,
    }));
  } catch (error) {
    logger.error('Error getting version history', error);
    throw error;
  }
}

/**
 * Get a specific version
 */
export async function getVersion(versionId: string): Promise<VersionSnapshot | null> {
  try {
    const version = await prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      return null;
    }

    return {
      id: version.id,
      resumeId: version.resumeId,
      versionNumber: version.versionNumber,
      snapshotData: version.snapshotData as Record<string, any>,
      createdAt: version.createdAt,
    };
  } catch (error) {
    logger.error('Error getting version', error);
    throw error;
  }
}

/**
 * Compare two versions
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string
): Promise<VersionComparison> {
  try {
    const version1 = await getVersion(versionId1);
    const version2 = await getVersion(versionId2);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    const changes: VersionComparison['changes'] = [];

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

    // Compare experiences
    const oldExperiences = version1.snapshotData.experiences || [];
    const newExperiences = version2.snapshotData.experiences || [];

    if (JSON.stringify(oldExperiences) !== JSON.stringify(newExperiences)) {
      changes.push({
        field: 'experiences',
        oldValue: oldExperiences,
        newValue: newExperiences,
      });
    }

    // Compare education
    const oldEducation = version1.snapshotData.education || [];
    const newEducation = version2.snapshotData.education || [];

    if (JSON.stringify(oldEducation) !== JSON.stringify(newEducation)) {
      changes.push({
        field: 'education',
        oldValue: oldEducation,
        newValue: newEducation,
      });
    }

    // Compare projects
    const oldProjects = version1.snapshotData.projects || [];
    const newProjects = version2.snapshotData.projects || [];

    if (JSON.stringify(oldProjects) !== JSON.stringify(newProjects)) {
      changes.push({
        field: 'projects',
        oldValue: oldProjects,
        newValue: newProjects,
      });
    }

    return {
      versionId1,
      versionId2,
      changes,
    };
  } catch (error) {
    logger.error('Error comparing versions', error);
    throw error;
  }
}

/**
 * Rollback to a previous version
 */
export async function rollbackToVersion(resumeId: string, versionId: string): Promise<void> {
  try {
    const version = await getVersion(versionId);

    if (!version || version.resumeId !== resumeId) {
      throw new Error('Version not found or does not belong to this resume');
    }

    const snapshotData = version.snapshotData;

    // Create a new snapshot before rollback
    await createVersionSnapshot(resumeId);

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
            startDate: new Date(exp.startDate),
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
  } catch (error) {
    logger.error('Error rolling back to version', error);
    throw error;
  }
}

/**
 * Delete old versions (keep last N versions)
 */
export async function cleanupOldVersions(resumeId: string, keepCount: number = 10): Promise<number> {
  try {
    // Get all versions ordered by version number
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
      skip: keepCount,
    });

    if (versions.length === 0) {
      return 0;
    }

    // Delete old versions
    const result = await prisma.resumeVersion.deleteMany({
      where: {
        id: { in: versions.map(v => v.id) },
      },
    });

    logger.info(`Deleted ${result.count} old versions for resume ${resumeId}`);

    return result.count;
  } catch (error) {
    logger.error('Error cleaning up old versions', error);
    throw error;
  }
}
