import { SharingService } from '@/features/resume/sharing-service';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    resumeShareLink: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock fetch for email sending
global.fetch = jest.fn();

describe('SharingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('generateShareToken', () => {
    it('should generate a unique token', () => {
      const token1 = SharingService.generateShareToken();
      const token2 = SharingService.generateShareToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toEqual(token2);
      expect(token1).toHaveLength(64); // 32 bytes * 2 hex chars
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(SharingService.generateShareToken());
      }
      expect(tokens.size).toBe(100); // All unique
    });
  });

  describe('createShareLink', () => {
    it('should create share links with valid data', async () => {
      const mockResume = {
        id: 'resume-1',
        title: 'My Resume',
        userId: 'user-1',
        user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      };

      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockShareLink = {
        id: 'share-1',
        resumeId: 'resume-1',
        shareToken: 'token-123',
        recipientEmail: 'recipient@example.com',
        senderId: 'user-1',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        viewCount: 0,
        lastViewedAt: null,
      };

      (prisma.resume.findUnique as jest.Mock).mockResolvedValue(mockResume);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.resumeShareLink.create as jest.Mock).mockResolvedValue(mockShareLink);

      const result = await SharingService.createShareLink(
        'resume-1',
        'user-1',
        ['recipient@example.com'],
        30
      );

      expect(result).toHaveLength(1);
      expect(result[0].recipientEmail).toBe('recipient@example.com');
      expect(result[0].shareToken).toBeDefined();
    });

    it('should throw error if resume not found', async () => {
      (prisma.resume.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        SharingService.createShareLink('invalid-id', 'user-1', ['recipient@example.com'])
      ).rejects.toThrow('Resume not found');
    });

    it('should throw error if sender not found', async () => {
      const mockResume = {
        id: 'resume-1',
        title: 'My Resume',
        user: { id: 'user-1', name: 'John Doe' },
      };

      (prisma.resume.findUnique as jest.Mock).mockResolvedValue(mockResume);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        SharingService.createShareLink('resume-1', 'invalid-user', ['recipient@example.com'])
      ).rejects.toThrow('Sender not found');
    });

    it('should apply default 30-day expiration', async () => {
      const mockResume = {
        id: 'resume-1',
        title: 'My Resume',
        user: { id: 'user-1', name: 'John Doe' },
      };

      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
      };

      (prisma.resume.findUnique as jest.Mock).mockResolvedValue(mockResume);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.resumeShareLink.create as jest.Mock).mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          id: 'share-1',
          createdAt: new Date(),
          viewCount: 0,
        });
      });

      await SharingService.createShareLink('resume-1', 'user-1', ['recipient@example.com']);

      const createCall = (prisma.resumeShareLink.create as jest.Mock).mock.calls[0];
      const expiresAt = createCall[0].data.expiresAt;
      const now = new Date();
      const expectedExpiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Allow 1 second tolerance
      expect(Math.abs(expiresAt.getTime() - expectedExpiration.getTime())).toBeLessThan(1000);
    });

    it('should create multiple share links for multiple recipients', async () => {
      const mockResume = {
        id: 'resume-1',
        title: 'My Resume',
        user: { id: 'user-1', name: 'John Doe' },
      };

      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
      };

      (prisma.resume.findUnique as jest.Mock).mockResolvedValue(mockResume);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.resumeShareLink.create as jest.Mock).mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          id: `share-${Math.random()}`,
          createdAt: new Date(),
          viewCount: 0,
        });
      });

      const recipients = ['recipient1@example.com', 'recipient2@example.com', 'recipient3@example.com'];
      const result = await SharingService.createShareLink('resume-1', 'user-1', recipients);

      expect(result).toHaveLength(3);
      expect(prisma.resumeShareLink.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('validateShareToken', () => {
    it('should return true for valid, non-expired, non-revoked token', async () => {
      const mockShareLink = {
        id: 'share-1',
        shareToken: 'token-123',
        resumeId: 'resume-1',
        senderId: 'user-1',
        recipientEmail: 'recipient@example.com',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        revokedAt: null,
        viewCount: 0,
        lastViewedAt: null,
      };

      (prisma.resumeShareLink.findUnique as jest.Mock).mockResolvedValue(mockShareLink);

      const result = await SharingService.validateShareToken('token-123');

      expect(result).toBe(true);
    });

    it('should return false for expired token', async () => {
      const mockShareLink = {
        id: 'share-1',
        shareToken: 'token-123',
        resumeId: 'resume-1',
        senderId: 'user-1',
        recipientEmail: 'recipient@example.com',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        revokedAt: null,
        viewCount: 0,
        lastViewedAt: null,
      };

      (prisma.resumeShareLink.findUnique as jest.Mock).mockResolvedValue(mockShareLink);

      const result = await SharingService.validateShareToken('token-123');

      expect(result).toBe(false);
    });

    it('should return false for revoked token', async () => {
      const mockShareLink = {
        id: 'share-1',
        shareToken: 'token-123',
        resumeId: 'resume-1',
        senderId: 'user-1',
        recipientEmail: 'recipient@example.com',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revokedAt: new Date(), // Revoked
        viewCount: 0,
        lastViewedAt: null,
      };

      (prisma.resumeShareLink.findUnique as jest.Mock).mockResolvedValue(mockShareLink);

      const result = await SharingService.validateShareToken('token-123');

      expect(result).toBe(false);
    });

    it('should return false for non-existent token', async () => {
      (prisma.resumeShareLink.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await SharingService.validateShareToken('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('extendExpiration', () => {
    it('should extend share link expiration', async () => {
      const originalExpiration = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const mockShareLink = {
        id: 'share-1',
        shareToken: 'token-123',
        resumeId: 'resume-1',
        senderId: 'user-1',
        recipientEmail: 'recipient@example.com',
        createdAt: new Date(),
        expiresAt: originalExpiration,
        revokedAt: null,
        viewCount: 0,
        lastViewedAt: null,
      };

      (prisma.resumeShareLink.findUnique as jest.Mock).mockResolvedValue(mockShareLink);
      (prisma.resumeShareLink.update as jest.Mock).mockResolvedValue({
        ...mockShareLink,
        expiresAt: new Date(originalExpiration.getTime() + 20 * 24 * 60 * 60 * 1000),
      });

      const result = await SharingService.extendExpiration('token-123', 20);

      expect(result).toBeDefined();
      expect(prisma.resumeShareLink.update).toHaveBeenCalledWith({
        where: { shareToken: 'token-123' },
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should throw error if share link not found', async () => {
      (prisma.resumeShareLink.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        SharingService.extendExpiration('invalid-token', 20)
      ).rejects.toThrow('Share link not found');
    });
  });

  describe('revokeShareLink', () => {
    it('should revoke share link', async () => {
      (prisma.resumeShareLink.update as jest.Mock).mockResolvedValue({
        id: 'share-1',
        revokedAt: new Date(),
      });

      await SharingService.revokeShareLink('token-123');

      expect(prisma.resumeShareLink.update).toHaveBeenCalledWith({
        where: { shareToken: 'token-123' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('recordShareLinkView', () => {
    it('should increment view count and update last viewed time', async () => {
      (prisma.resumeShareLink.update as jest.Mock).mockResolvedValue({
        id: 'share-1',
        viewCount: 1,
        lastViewedAt: new Date(),
      });

      await SharingService.recordShareLinkView('token-123');

      expect(prisma.resumeShareLink.update).toHaveBeenCalledWith({
        where: { shareToken: 'token-123' },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getShareSummary', () => {
    it('should calculate share summary correctly', async () => {
      const now = new Date();
      const mockShareLinks = [
        {
          id: 'share-1',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          recipientEmail: 'recipient1@example.com',
          senderId: 'user-1',
          createdAt: new Date(),
          expiresAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // Active
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: new Date(),
        },
        {
          id: 'share-2',
          resumeId: 'resume-1',
          shareToken: 'token-2',
          recipientEmail: 'recipient2@example.com',
          senderId: 'user-1',
          createdAt: new Date(),
          expiresAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // Expired
          revokedAt: null,
          viewCount: 2,
          lastViewedAt: null,
        },
        {
          id: 'share-3',
          resumeId: 'resume-1',
          shareToken: 'token-3',
          recipientEmail: 'recipient3@example.com',
          senderId: 'user-1',
          createdAt: new Date(),
          expiresAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
          revokedAt: new Date(), // Revoked
          viewCount: 0,
          lastViewedAt: null,
        },
      ];

      (prisma.resumeShareLink.findMany as jest.Mock).mockResolvedValue(mockShareLinks);

      const summary = await SharingService.getShareSummary('resume-1');

      expect(summary.totalShares).toBe(3);
      expect(summary.activeLinks).toBe(1); // Only token-1 is active
      expect(summary.expiredLinks).toBe(1); // Only token-2 is expired
    });
  });

  describe('getRemainingTime', () => {
    it('should calculate remaining time correctly', () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 30 * 60 * 1000); // 5 days, 3 hours, 30 minutes

      const result = SharingService.getRemainingTime(expiresAt);

      expect(result.days).toBe(5);
      expect(result.hours).toBe(3);
      expect(result.minutes).toBe(30);
      expect(result.isExpired).toBe(false);
    });

    it('should return isExpired true for past dates', () => {
      const pastDate = new Date(Date.now() - 1000);

      const result = SharingService.getRemainingTime(pastDate);

      expect(result.isExpired).toBe(true);
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
    });
  });

  describe('deleteExpiredShareLinks', () => {
    it('should delete expired and revoked share links', async () => {
      (prisma.resumeShareLink.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await SharingService.deleteExpiredShareLinks();

      expect(result).toBe(5);
      expect(prisma.resumeShareLink.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          revokedAt: { not: null },
        },
      });
    });
  });

  describe('getShareLinks', () => {
    it('should retrieve all share links for a resume', async () => {
      const mockShareLinks = [
        {
          id: 'share-1',
          resumeId: 'resume-1',
          shareToken: 'token-1',
          recipientEmail: 'recipient1@example.com',
          senderId: 'user-1',
          createdAt: new Date(),
          expiresAt: new Date(),
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: null,
        },
        {
          id: 'share-2',
          resumeId: 'resume-1',
          shareToken: 'token-2',
          recipientEmail: 'recipient2@example.com',
          senderId: 'user-1',
          createdAt: new Date(),
          expiresAt: new Date(),
          revokedAt: null,
          viewCount: 2,
          lastViewedAt: null,
        },
      ];

      (prisma.resumeShareLink.findMany as jest.Mock).mockResolvedValue(mockShareLinks);

      const result = await SharingService.getShareLinks('resume-1');

      expect(result).toHaveLength(2);
      expect(prisma.resumeShareLink.findMany).toHaveBeenCalledWith({
        where: { resumeId: 'resume-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getShareLinkDetails', () => {
    it('should retrieve share link details', async () => {
      const mockShareLink = {
        id: 'share-1',
        resumeId: 'resume-1',
        shareToken: 'token-123',
        recipientEmail: 'recipient@example.com',
        senderId: 'user-1',
        createdAt: new Date(),
        expiresAt: new Date(),
        revokedAt: null,
        viewCount: 5,
        lastViewedAt: new Date(),
      };

      (prisma.resumeShareLink.findUnique as jest.Mock).mockResolvedValue(mockShareLink);

      const result = await SharingService.getShareLinkDetails('token-123');

      expect(result).toEqual(mockShareLink);
    });

    it('should return null if share link not found', async () => {
      (prisma.resumeShareLink.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await SharingService.getShareLinkDetails('invalid-token');

      expect(result).toBeNull();
    });
  });
});
