import { AnalyticsService } from '@/features/resume/analytics-service';
import { prisma } from '@/lib/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    resumeView: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    resumeExport: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    resumeShareLink: {
      findMany: jest.fn(),
    },
  },
}));

// Mock UAParser
jest.mock('ua-parser-js', () => {
  return jest.fn().mockImplementation(() => ({
    getResult: () => ({
      device: { type: 'desktop' },
      browser: { name: 'Chrome' },
      os: { name: 'Windows' },
    }),
  }));
});

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordView', () => {
    it('should record view with device metadata', async () => {
      const mockMetadata = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.1',
        viewerEmail: 'viewer@example.com',
      };

      (prisma.resumeView.create as jest.Mock).mockResolvedValue({
        id: 'view-1',
        resumeId: 'resume-1',
        shareToken: 'token-123',
        deviceType: 'desktop',
        browser: 'Chrome',
        operatingSystem: 'Windows',
        viewerEmail: 'viewer@example.com',
        createdAt: new Date(),
      });

      (prisma.resumeView.count as jest.Mock).mockResolvedValue(100);

      await AnalyticsService.recordView('resume-1', 'token-123', mockMetadata);

      expect(prisma.resumeView.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resumeId: 'resume-1',
          shareToken: 'token-123',
          deviceType: 'desktop',
          browser: 'Chrome',
          operatingSystem: 'Windows',
          viewerEmail: 'viewer@example.com',
        }),
      });
    });

    it('should handle missing user agent gracefully', async () => {
      (prisma.resumeView.create as jest.Mock).mockResolvedValue({
        id: 'view-1',
        resumeId: 'resume-1',
        shareToken: 'token-123',
        deviceType: 'desktop',
        browser: undefined,
        operatingSystem: undefined,
        createdAt: new Date(),
      });

      (prisma.resumeView.count as jest.Mock).mockResolvedValue(100);

      await AnalyticsService.recordView('resume-1', 'token-123', {});

      expect(prisma.resumeView.create).toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      (prisma.resumeView.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        AnalyticsService.recordView('resume-1', 'token-123', {})
      ).rejects.toThrow('Failed to record view');
    });
  });

  describe('recordDownload', () => {
    it('should increment download count', async () => {
      (prisma.resumeExport.update as jest.Mock).mockResolvedValue({
        id: 'export-1',
        downloadCount: 1,
      });

      await AnalyticsService.recordDownload('export-1');

      expect(prisma.resumeExport.update).toHaveBeenCalledWith({
        where: { id: 'export-1' },
        data: { downloadCount: { increment: 1 } },
      });
    });

    it('should throw error on database failure', async () => {
      (prisma.resumeExport.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        AnalyticsService.recordDownload('export-1')
      ).rejects.toThrow('Failed to record download');
    });
  });

  describe('getAnalytics', () => {
    it('should return complete analytics data', async () => {
      const now = new Date();
      const mockViews = [
        {
          id: 'view-1',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'desktop',
          browser: 'Chrome',
          operatingSystem: 'Windows',
          country: 'US',
          city: 'New York',
          viewerEmail: 'viewer1@example.com',
          timeSpentSeconds: 120,
          createdAt: now,
        },
        {
          id: 'view-2',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'mobile',
          browser: 'Safari',
          operatingSystem: 'iOS',
          country: 'US',
          city: 'Los Angeles',
          viewerEmail: 'viewer2@example.com',
          timeSpentSeconds: 90,
          createdAt: new Date(now.getTime() - 1000),
        },
      ];

      const mockExports = [
        {
          id: 'export-1',
          resumeId: 'resume-1',
          template: 'Modern',
          fileSize: 1024,
          downloadCount: 2,
          createdAt: now,
        },
        {
          id: 'export-2',
          resumeId: 'resume-1',
          template: 'Classic',
          fileSize: 1024,
          downloadCount: 1,
          createdAt: new Date(now.getTime() - 1000),
        },
      ];

      const mockShareLinks = [
        {
          id: 'share-1',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          recipientEmail: 'recipient@example.com',
          senderId: 'user-1',
          createdAt: now,
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: now,
        },
      ];

      (prisma.resumeView.findMany as jest.Mock).mockResolvedValue(mockViews);
      (prisma.resumeExport.findMany as jest.Mock).mockResolvedValue(mockExports);
      (prisma.resumeShareLink.findMany as jest.Mock).mockResolvedValue(mockShareLinks);

      const result = await AnalyticsService.getAnalytics('resume-1');

      expect(result.totalViews).toBe(2);
      expect(result.uniqueViewers).toBe(2);
      expect(result.downloadCount).toBe(3);
      expect(result.shareCount).toBe(1);
      expect(result.downloadToViewRatio).toBe(1.5);
      expect(result.shareToViewRatio).toBe(0.5);
      expect(result.recentViewers).toHaveLength(2);
      expect(result.viewTrend).toBeDefined();
    });

    it('should handle zero views correctly', async () => {
      (prisma.resumeView.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.resumeExport.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.resumeShareLink.findMany as jest.Mock).mockResolvedValue([]);

      const result = await AnalyticsService.getAnalytics('resume-1');

      expect(result.totalViews).toBe(0);
      expect(result.uniqueViewers).toBe(0);
      expect(result.downloadCount).toBe(0);
      expect(result.shareCount).toBe(0);
      expect(result.downloadToViewRatio).toBe(0);
      expect(result.shareToViewRatio).toBe(0);
    });

    it('should throw error on database failure', async () => {
      (prisma.resumeView.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        AnalyticsService.getAnalytics('resume-1')
      ).rejects.toThrow('Failed to get analytics');
    });
  });

  describe('getRecentViewers', () => {
    it('should retrieve recent viewers with pagination', async () => {
      const mockViewers = [
        {
          id: 'view-1',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'desktop',
          browser: 'Chrome',
          operatingSystem: 'Windows',
          country: 'US',
          city: 'New York',
          viewerEmail: 'viewer1@example.com',
          timeSpentSeconds: 120,
          createdAt: new Date(),
        },
        {
          id: 'view-2',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'mobile',
          browser: 'Safari',
          operatingSystem: 'iOS',
          country: 'US',
          city: 'Los Angeles',
          viewerEmail: 'viewer2@example.com',
          timeSpentSeconds: 90,
          createdAt: new Date(),
        },
      ];

      (prisma.resumeView.findMany as jest.Mock).mockResolvedValue(mockViewers);
      (prisma.resumeView.count as jest.Mock).mockResolvedValue(2);

      const result = await AnalyticsService.getRecentViewers('resume-1', 50, 0);

      expect(result.viewers).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(prisma.resumeView.findMany).toHaveBeenCalledWith({
        where: { resumeId: 'resume-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should support pagination with offset', async () => {
      const mockViewers = [
        {
          id: 'view-3',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'desktop',
          browser: 'Firefox',
          operatingSystem: 'Linux',
          country: 'UK',
          city: 'London',
          viewerEmail: 'viewer3@example.com',
          timeSpentSeconds: 150,
          createdAt: new Date(),
        },
      ];

      (prisma.resumeView.findMany as jest.Mock).mockResolvedValue(mockViewers);
      (prisma.resumeView.count as jest.Mock).mockResolvedValue(100);

      const result = await AnalyticsService.getRecentViewers('resume-1', 50, 50);

      expect(result.viewers).toHaveLength(1);
      expect(result.total).toBe(100);
      expect(prisma.resumeView.findMany).toHaveBeenCalledWith({
        where: { resumeId: 'resume-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 50,
      });
    });

    it('should throw error on database failure', async () => {
      (prisma.resumeView.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        AnalyticsService.getRecentViewers('resume-1')
      ).rejects.toThrow('Failed to get recent viewers');
    });
  });

  describe('getSectionEngagement', () => {
    it('should return section engagement metrics', async () => {
      const result = await AnalyticsService.getSectionEngagement('resume-1');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should return analytics summary', async () => {
      const mockViews = [
        {
          id: 'view-1',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'desktop',
          browser: 'Chrome',
          operatingSystem: 'Windows',
          country: 'US',
          city: 'New York',
          viewerEmail: 'viewer1@example.com',
          timeSpentSeconds: 120,
          createdAt: new Date(),
        },
        {
          id: 'view-2',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'mobile',
          browser: 'Safari',
          operatingSystem: 'iOS',
          country: 'US',
          city: 'Los Angeles',
          viewerEmail: 'viewer2@example.com',
          timeSpentSeconds: 90,
          createdAt: new Date(),
        },
      ];

      const mockExports = [
        {
          id: 'export-1',
          resumeId: 'resume-1',
          template: 'Modern',
          fileSize: 1024,
          downloadCount: 2,
          createdAt: new Date(),
        },
      ];

      const mockShareLinks = [
        {
          id: 'share-1',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          recipientEmail: 'recipient@example.com',
          senderId: 'user-1',
          createdAt: new Date(),
          expiresAt: new Date(),
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: new Date(),
        },
      ];

      (prisma.resumeView.findMany as jest.Mock).mockResolvedValue(mockViews);
      (prisma.resumeExport.findMany as jest.Mock).mockResolvedValue(mockExports);
      (prisma.resumeShareLink.findMany as jest.Mock).mockResolvedValue(mockShareLinks);

      const result = await AnalyticsService.getAnalyticsSummary('resume-1');

      expect(result.totalViews).toBe(2);
      expect(result.uniqueViewers).toBe(2);
      expect(result.totalDownloads).toBe(2);
      expect(result.totalShares).toBe(1);
    });

    it('should throw error on database failure', async () => {
      (prisma.resumeView.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        AnalyticsService.getAnalyticsSummary('resume-1')
      ).rejects.toThrow('Failed to get analytics summary');
    });
  });

  describe('View trend calculation', () => {
    it('should calculate view trend for last 7 days', async () => {
      const now = new Date();
      const mockViews = [
        {
          id: 'view-1',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'desktop',
          browser: 'Chrome',
          operatingSystem: 'Windows',
          country: 'US',
          city: 'New York',
          viewerEmail: 'viewer1@example.com',
          timeSpentSeconds: 120,
          createdAt: now,
        },
        {
          id: 'view-2',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'mobile',
          browser: 'Safari',
          operatingSystem: 'iOS',
          country: 'US',
          city: 'Los Angeles',
          viewerEmail: 'viewer2@example.com',
          timeSpentSeconds: 90,
          createdAt: now,
        },
        {
          id: 'view-3',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          deviceType: 'desktop',
          browser: 'Firefox',
          operatingSystem: 'Linux',
          country: 'UK',
          city: 'London',
          viewerEmail: 'viewer3@example.com',
          timeSpentSeconds: 150,
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        },
      ];

      (prisma.resumeView.findMany as jest.Mock).mockResolvedValue(mockViews);
      (prisma.resumeExport.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.resumeShareLink.findMany as jest.Mock).mockResolvedValue([]);

      const result = await AnalyticsService.getAnalytics('resume-1');

      expect(result.viewTrend).toBeDefined();
      expect(result.viewTrend.length).toBe(7);
      expect(result.viewTrend[0]).toHaveProperty('date');
      expect(result.viewTrend[0]).toHaveProperty('count');
    });
  });
});
