import { VersioningService } from '@/features/resume/versioning-service';
import { prisma } from '@/lib/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    resumeVersion: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    resumeExperience: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    resumeProject: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    resumeEducation: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

describe('VersioningService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createVersion', () => {
    it('should create version snapshot with complete resume data', async () => {
      const mockResume = {
        id: 'resume-1',
        title: 'My Resume',
        summary: 'Professional summary',
        skills: ['JavaScript', 'React'],
        location: 'New York',
        notableAchievements: 'Achievements',
        personaName: 'John Doe',
        targetIndustry: 'Tech',
        targetRoles: ['Developer'],
        topSkills: ['JavaScript'],
        yearsExperience: 5,
        template: 'Modern',
        headshotUrl: 'https://example.com/photo.jpg',
        experiences: [{ id: 'exp-1', title: 'Developer' }],
        projects: [{ id: 'proj-1', title: 'Project' }],
        education: [{ id: 'edu-1', school: 'University' }],
      };

      (prisma.resume.findUnique as jest.Mock).mockResolvedValue(mockResume);
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.resumeVersion.create as jest.Mock).mockResolvedValue({
        id: 'version-1',
        resumeId: 'resume-1',
        versionNumber: 1,
        data: expect.any(Object),
        changeDescription: 'Initial version',
        createdBy: 'user-1',
        createdAt: new Date(),
        archivedAt: null,
      });

      const result = await VersioningService.createVersion('resume-1', 'user-1', 'Initial version');

      expect(result).toBeDefined();
      expect(result.versionNumber).toBe(1);
      expect(prisma.resumeVersion.create).toHaveBeenCalled();
    });

    it('should increment version number correctly', async () => {
      const mockResume = {
        id: 'resume-1',
        title: 'My Resume',
        summary: 'Summary',
        skills: [],
        location: 'Location',
        notableAchievements: null,
        personaName: null,
        targetIndustry: null,
        targetRoles: [],
        topSkills: [],
        yearsExperience: 0,
        template: 'Modern',
        headshotUrl: null,
        experiences: [],
        projects: [],
        education: [],
      };

      const mockLastVersion = {
        id: 'version-5',
        versionNumber: 5,
      };

      (prisma.resume.findUnique as jest.Mock).mockResolvedValue(mockResume);
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(mockLastVersion);
      (prisma.resumeVersion.create as jest.Mock).mockResolvedValue({
        id: 'version-6',
        resumeId: 'resume-1',
        versionNumber: 6,
        data: expect.any(Object),
        changeDescription: 'Updated',
        createdBy: 'user-1',
        createdAt: new Date(),
        archivedAt: null,
      });

      const result = await VersioningService.createVersion('resume-1', 'user-1', 'Updated');

      expect(result.versionNumber).toBe(6);
    });

    it('should throw error if resume not found', async () => {
      (prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        VersioningService.createVersion('invalid-id', 'user-1')
      ).rejects.toThrow('Resume not found');
    });
  });

  describe('getVersionHistory', () => {
    it('should retrieve version history in reverse chronological order', async () => {
      const mockVersions = [
        {
          id: 'version-3',
          resumeId: 'resume-1',
          versionNumber: 3,
          data: {},
          changeDescription: 'Third update',
          createdBy: 'user-1',
          createdAt: new Date(Date.now() - 1000),
          archivedAt: null,
        },
        {
          id: 'version-2',
          resumeId: 'resume-1',
          versionNumber: 2,
          data: {},
          changeDescription: 'Second update',
          createdBy: 'user-1',
          createdAt: new Date(Date.now() - 2000),
          archivedAt: null,
        },
        {
          id: 'version-1',
          resumeId: 'resume-1',
          versionNumber: 1,
          data: {},
          changeDescription: 'Initial',
          createdBy: 'user-1',
          createdAt: new Date(Date.now() - 3000),
          archivedAt: null,
        },
      ];

      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue(mockVersions);

      const result = await VersioningService.getVersionHistory('resume-1');

      expect(result).toHaveLength(3);
      expect(result[0].versionNumber).toBe(3);
      expect(result[1].versionNumber).toBe(2);
      expect(result[2].versionNumber).toBe(1);
    });

    it('should exclude archived versions', async () => {
      const mockVersions = [
        {
          id: 'version-2',
          resumeId: 'resume-1',
          versionNumber: 2,
          data: {},
          changeDescription: 'Second',
          createdBy: 'user-1',
          createdAt: new Date(),
          archivedAt: null,
        },
        {
          id: 'version-1',
          resumeId: 'resume-1',
          versionNumber: 1,
          data: {},
          changeDescription: 'First',
          createdBy: 'user-1',
          createdAt: new Date(),
          archivedAt: null,
        },
      ];

      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue(mockVersions);

      const result = await VersioningService.getVersionHistory('resume-1');

      expect(result).toHaveLength(2);
      expect(prisma.resumeVersion.findMany).toHaveBeenCalledWith({
        where: {
          resumeId: 'resume-1',
          archivedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('restoreVersion', () => {
    it('should restore version and create backup snapshot', async () => {
      const mockVersion = {
        id: 'version-1',
        resumeId: 'resume-1',
        versionNumber: 1,
        data: {
          title: 'Old Title',
          summary: 'Old Summary',
          skills: ['Old Skill'],
          location: 'Old Location',
          notableAchievements: null,
          personaName: null,
          targetIndustry: null,
          targetRoles: [],
          topSkills: [],
          yearsExperience: 0,
          template: 'Classic',
          headshotUrl: null,
          experiences: [],
          projects: [],
          education: [],
        },
        changeDescription: 'Initial',
        createdBy: 'user-1',
        createdAt: new Date(),
        archivedAt: null,
      };

      (prisma.resumeVersion.findUnique as jest.Mock).mockResolvedValue(mockVersion);
      (prisma.resume.findUnique as jest.Mock).mockResolvedValue({
        id: 'resume-1',
        title: 'Current Title',
        summary: 'Current Summary',
        skills: ['Current Skill'],
        location: 'Current Location',
        notableAchievements: null,
        personaName: null,
        targetIndustry: null,
        targetRoles: [],
        topSkills: [],
        yearsExperience: 0,
        template: 'Modern',
        headshotUrl: null,
        experiences: [],
        projects: [],
        education: [],
      });
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.resumeVersion.create as jest.Mock).mockResolvedValue({
        id: 'version-backup',
        versionNumber: 2,
      });
      (prisma.resume.update as jest.Mock).mockResolvedValue({});
      (prisma.resumeExperience.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.resumeProject.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.resumeEducation.deleteMany as jest.Mock).mockResolvedValue({});

      await VersioningService.restoreVersion('resume-1', 'version-1', 'user-1');

      expect(prisma.resume.update).toHaveBeenCalledWith({
        where: { id: 'resume-1' },
        data: expect.objectContaining({
          title: 'Old Title',
          summary: 'Old Summary',
        }),
      });
    });

    it('should throw error if version not found', async () => {
      (prisma.resumeVersion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        VersioningService.restoreVersion('resume-1', 'invalid-version', 'user-1')
      ).rejects.toThrow('Version not found');
    });

    it('should throw error if version does not belong to resume', async () => {
      const mockVersion = {
        id: 'version-1',
        resumeId: 'resume-2', // Different resume
        versionNumber: 1,
        data: {},
        changeDescription: 'Initial',
        createdBy: 'user-1',
        createdAt: new Date(),
        archivedAt: null,
      };

      (prisma.resumeVersion.findUnique as jest.Mock).mockResolvedValue(mockVersion);

      await expect(
        VersioningService.restoreVersion('resume-1', 'version-1', 'user-1')
      ).rejects.toThrow('Version does not belong to this resume');
    });
  });

  describe('archiveOldVersions', () => {
    it('should archive versions exceeding 50 limit', async () => {
      const mockVersions = Array.from({ length: 60 }, (_, i) => ({
        id: `version-${i + 1}`,
        versionNumber: i + 1,
        createdAt: new Date(Date.now() - i * 1000),
        archivedAt: null,
      }));

      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue(mockVersions);
      (prisma.resumeVersion.updateMany as jest.Mock).mockResolvedValue({ count: 10 });

      await VersioningService.archiveOldVersions('resume-1');

      expect(prisma.resumeVersion.updateMany).toHaveBeenCalled();
      const updateCall = (prisma.resumeVersion.updateMany as jest.Mock).mock.calls[0];
      expect(updateCall[0].where.id.in).toHaveLength(10); // 60 - 50 = 10
    });

    it('should not archive if under 50 versions', async () => {
      const mockVersions = Array.from({ length: 30 }, (_, i) => ({
        id: `version-${i + 1}`,
        versionNumber: i + 1,
        createdAt: new Date(),
        archivedAt: null,
      }));

      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue(mockVersions);

      await VersioningService.archiveOldVersions('resume-1');

      expect(prisma.resumeVersion.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteArchivedVersions', () => {
    it('should delete archived versions older than 90 days', async () => {
      (prisma.resumeVersion.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await VersioningService.deleteArchivedVersions();

      expect(result).toBe(5);
      expect(prisma.resumeVersion.deleteMany).toHaveBeenCalledWith({
        where: {
          archivedAt: { lt: expect.any(Date) },
        },
      });
    });
  });

  describe('getVersionCount', () => {
    it('should return count of non-archived versions', async () => {
      (prisma.resumeVersion.count as jest.Mock).mockResolvedValue(15);

      const result = await VersioningService.getVersionCount('resume-1');

      expect(result).toBe(15);
      expect(prisma.resumeVersion.count).toHaveBeenCalledWith({
        where: {
          resumeId: 'resume-1',
          archivedAt: null,
        },
      });
    });
  });

  describe('compareVersions', () => {
    it('should identify differences between versions', async () => {
      const mockVersion1 = {
        id: 'version-1',
        resumeId: 'resume-1',
        versionNumber: 1,
        data: {
          title: 'Old Title',
          summary: 'Old Summary',
          skills: ['Skill1'],
        },
        changeDescription: 'Initial',
        createdBy: 'user-1',
        createdAt: new Date(),
        archivedAt: null,
      };

      const mockVersion2 = {
        id: 'version-2',
        resumeId: 'resume-1',
        versionNumber: 2,
        data: {
          title: 'New Title',
          summary: 'Old Summary',
          skills: ['Skill1', 'Skill2'],
        },
        changeDescription: 'Updated',
        createdBy: 'user-1',
        createdAt: new Date(),
        archivedAt: null,
      };

      (prisma.resumeVersion.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVersion1)
        .mockResolvedValueOnce(mockVersion2);

      const result = await VersioningService.compareVersions('version-1', 'version-2');

      expect(result.differences).toBeDefined();
      expect(result.differences.title).toBeDefined();
      expect(result.differences.title.before).toBe('Old Title');
      expect(result.differences.title.after).toBe('New Title');
      expect(result.differences.skills).toBeDefined();
    });

    it('should throw error if version not found', async () => {
      (prisma.resumeVersion.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({});

      await expect(
        VersioningService.compareVersions('version-1', 'version-2')
      ).rejects.toThrow('One or both versions not found');
    });
  });
});
