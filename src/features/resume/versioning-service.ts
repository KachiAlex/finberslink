import { prisma } from '@/lib/prisma';
import { Resume, ResumeVersion } from '@prisma/client';

export interface Version {
  id: string;
  resumeId: string;
  versionNumber: number;
  data: any;
  changeDescription?: string;
  createdAt: Date;
  createdBy: string;
  archivedAt?: Date;
}

/**
 * Versioning Service
 * Tracks resume changes and enables restoration
 */
export class VersioningService {
  private static readonly MAX_VERSIONS = 50;
  private static readonly ARCHIVE_RETENTION_DAYS = 90;

  /**
   * Create version snapshot of resume
   */
  static async createVersion(
    resumeId: string,
    userId: string,
    changeDescription?: string
  ): Promise<Version> {
    try {
      // Fetch current resume data
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        include: {
          experiences: true,
          projects: true,
          education: true,
        },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      // Get next version number
      const lastVersion = await prisma.resumeVersion.findFirst({
        where: { resumeId },
        orderBy: { versionNumber: 'desc' },
      });

      const versionNumber = (lastVersion?.versionNumber || 0) + 1;

      // Create snapshot with complete resume data
      const snapshot = {
        title: resume.title,
        summary: resume.summary,
        skills: resume.skills,
        location: resume.location,
        notableAchievements: resume.notableAchievements,
        personaName: resume.personaName,
        targetIndustry: resume.targetIndustry,
        targetRoles: resume.targetRoles,
        topSkills: resume.topSkills,
        yearsExperience: resume.yearsExperience,
        template: resume.template,
        headshotUrl: resume.headshotUrl,
        experiences: resume.experiences,
        projects: resume.projects,
        education: resume.education,
      };

      const version = await prisma.resumeVersion.create({
        data: {
          resumeId,
          versionNumber,
          data: snapshot,
          changeDescription,
          createdBy: userId,
        },
      });

      // Archive old versions if exceeding limit
      await this.archiveOldVersions(resumeId);

      return version;
    } catch (error) {
      throw new Error(`Failed to create version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get version history for a resume
   */
  static async getVersionHistory(resumeId: string): Promise<Version[]> {
    try {
      const versions = await prisma.resumeVersion.findMany({
        where: {
          resumeId,
          archivedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return versions;
    } catch (error) {
      throw new Error(`Failed to retrieve version history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore previous version
   */
  static async restoreVersion(
    resumeId: string,
    versionId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get the version to restore
      const version = await prisma.resumeVersion.findUnique({
        where: { id: versionId },
      });

      if (!version) {
        throw new Error(`Version not found: ${versionId}`);
      }

      if (version.resumeId !== resumeId) {
        throw new Error('Version does not belong to this resume');
      }

      // Create snapshot of current state before restoration
      await this.createVersion(resumeId, userId, `Restored from version ${version.versionNumber}`);

      // Restore the version data
      const versionData = version.data as any;

      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          title: versionData.title,
          summary: versionData.summary,
          skills: versionData.skills,
          location: versionData.location,
          notableAchievements: versionData.notableAchievements,
          personaName: versionData.personaName,
          targetIndustry: versionData.targetIndustry,
          targetRoles: versionData.targetRoles,
          topSkills: versionData.topSkills,
          yearsExperience: versionData.yearsExperience,
          template: versionData.template,
          headshotUrl: versionData.headshotUrl,
        },
      });

      // Delete and recreate experiences
      await prisma.resumeExperience.deleteMany({ where: { resumeId } });
      if (versionData.experiences && Array.isArray(versionData.experiences)) {
        await prisma.resumeExperience.createMany({
          data: versionData.experiences.map((exp: any) => ({
            ...exp,
            resumeId,
          })),
        });
      }

      // Delete and recreate projects
      await prisma.resumeProject.deleteMany({ where: { resumeId } });
      if (versionData.projects && Array.isArray(versionData.projects)) {
        await prisma.resumeProject.createMany({
          data: versionData.projects.map((proj: any) => ({
            ...proj,
            resumeId,
          })),
        });
      }

      // Delete and recreate education
      await prisma.resumeEducation.deleteMany({ where: { resumeId } });
      if (versionData.education && Array.isArray(versionData.education)) {
        await prisma.resumeEducation.createMany({
          data: versionData.education.map((edu: any) => ({
            ...edu,
            resumeId,
          })),
        });
      }
    } catch (error) {
      throw new Error(`Failed to restore version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Archive old versions (keep 50 most recent)
   */
  static async archiveOldVersions(resumeId: string): Promise<void> {
    try {
      const versions = await prisma.resumeVersion.findMany({
        where: { resumeId, archivedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      if (versions.length > this.MAX_VERSIONS) {
        const versionsToArchive = versions.slice(this.MAX_VERSIONS);

        await prisma.resumeVersion.updateMany({
          where: {
            id: { in: versionsToArchive.map(v => v.id) },
          },
          data: { archivedAt: new Date() },
        });
      }
    } catch (error) {
      throw new Error(`Failed to archive old versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete archived versions older than retention period
   */
  static async deleteArchivedVersions(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.ARCHIVE_RETENTION_DAYS);

      const result = await prisma.resumeVersion.deleteMany({
        where: {
          archivedAt: { lt: cutoffDate },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(`Failed to delete archived versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get version count for a resume
   */
  static async getVersionCount(resumeId: string): Promise<number> {
    try {
      const count = await prisma.resumeVersion.count({
        where: { resumeId, archivedAt: null },
      });

      return count;
    } catch (error) {
      throw new Error(`Failed to get version count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare two versions
   */
  static async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{ differences: Record<string, any> }> {
    try {
      const version1 = await prisma.resumeVersion.findUnique({
        where: { id: versionId1 },
      });

      const version2 = await prisma.resumeVersion.findUnique({
        where: { id: versionId2 },
      });

      if (!version1 || !version2) {
        throw new Error('One or both versions not found');
      }

      const differences: Record<string, any> = {};

      // Compare top-level fields
      const data1 = version1.data as any;
      const data2 = version2.data as any;

      Object.keys(data1).forEach(key => {
        if (JSON.stringify(data1[key]) !== JSON.stringify(data2[key])) {
          differences[key] = {
            before: data1[key],
            after: data2[key],
          };
        }
      });

      return { differences };
    } catch (error) {
      throw new Error(`Failed to compare versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
