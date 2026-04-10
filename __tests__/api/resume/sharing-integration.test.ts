import { SharingService } from '@/features/resume/sharing-service';
import { prisma } from '@/lib/prisma';

/**
 * Integration tests for the complete sharing flow
 * Tests: Create share link → Send email → Access link → Verify view recorded
 */
describe('Resume Sharing - Integration Tests', () => {
  describe('Complete sharing flow', () => {
    it('should create share link with valid data', async () => {
      // Arrange
      const resumeId = 'test-resume-1';
      const senderId = 'test-user-1';
      const recipients = ['recipient@example.com'];

      // Mock data
      const mockResume = {
        id: resumeId,
        title: 'Test Resume',
        userId: senderId,
        user: { id: senderId, name: 'Test User', email: 'sender@example.com' },
      };

      const mockUser = {
        id: senderId,
        name: 'Test User',
        email: 'sender@example.com',
      };

      // Mock Prisma calls
      jest.spyOn(prisma.resume, 'findUnique').mockResolvedValue(mockResume as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.resumeShareLink, 'create').mockImplementation(({ data }) => {
        return Promise.resolve({
          id: `share-${Math.random()}`,
          ...data,
          createdAt: new Date(),
          viewCount: 0,
        } as any);
      });

      // Act
      const shareLinks = await SharingService.createShareLink(
        resumeId,
        senderId,
        recipients,
        30
      );

      // Assert
      expect(shareLinks).toHaveLength(1);
      expect(shareLinks[0].recipientEmail).toBe('recipient@example.com');
      expect(shareLinks[0].shareToken).toBeDefined();
      expect(shareLinks[0].shareToken).toHaveLength(64);
    });

    it('should validate share token correctly', async () => {
      // Arrange
      const shareToken = 'valid-token-123';
      const mockShareLink = {
        id: 'share-1',
        shareToken,
        resumeId: 'resume-1',
        senderId: 'user-1',
        recipientEmail: 'recipient@example.com',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        revokedAt: null,
        viewCount: 0,
        lastViewedAt: null,
      };

      jest.spyOn(prisma.resumeShareLink, 'findUnique').mockResolvedValue(mockShareLink as any);

      // Act
      const isValid = await SharingService.validateShareToken(shareToken);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject expired share token', async () => {
      // Arrange
      const shareToken = 'expired-token-123';
      const mockShareLink = {
        id: 'share-1',
        shareToken,
        resumeId: 'resume-1',
        senderId: 'user-1',
        recipientEmail: 'recipient@example.com',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        revokedAt: null,
        viewCount: 0,
        lastViewedAt: null,
      };

      jest.spyOn(prisma.resumeShareLink, 'findUnique').mockResolvedValue(mockShareLink as any);

      // Act
      const isValid = await SharingService.validateShareToken(shareToken);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject revoked share token', async () => {
      // Arrange
      const shareToken = 'revoked-token-123';
      const mockShareLink = {
        id: 'share-1',
        shareToken,
        resumeId: 'resume-1',
        senderId: 'user-1',
        recipientEmail: 'recipient@example.com',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revokedAt: new Date(), // Revoked
        viewCount: 0,
        lastViewedAt: null,
      };

      jest.spyOn(prisma.resumeShareLink, 'findUnique').mockResolvedValue(mockShareLink as any);

      // Act
      const isValid = await SharingService.validateShareToken(shareToken);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should record view on share link access', async () => {
      // Arrange
      const shareToken = 'token-123';
      jest.spyOn(prisma.resumeShareLink, 'update').mockResolvedValue({
        id: 'share-1',
        viewCount: 1,
        lastViewedAt: new Date(),
      } as any);

      // Act
      await SharingService.recordShareLinkView(shareToken);

      // Assert
      expect(prisma.resumeShareLink.update).toHaveBeenCalledWith({
        where: { shareToken },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: expect.any(Date),
        },
      });
    });

    it('should extend share link expiration', async () => {
      // Arrange
      const shareToken = 'token-123';
      const originalExpiration = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const mockShareLink = {
        id: 'share-1',
        shareToken,
        resumeId: 'resume-1',
        senderId: 'user-1',
        recipientEmail: 'recipient@example.com',
        createdAt: new Date(),
        expiresAt: originalExpiration,
        revokedAt: null,
        viewCount: 0,
        lastViewedAt: null,
      };

      jest.spyOn(prisma.resumeShareLink, 'findUnique').mockResolvedValue(mockShareLink as any);
      jest.spyOn(prisma.resumeShareLink, 'update').mockResolvedValue({
        ...mockShareLink,
        expiresAt: new Date(originalExpiration.getTime() + 20 * 24 * 60 * 60 * 1000),
      } as any);

      // Act
      const newExpiration = await SharingService.extendExpiration(shareToken, 20);

      // Assert
      expect(newExpiration).toBeDefined();
      expect(prisma.resumeShareLink.update).toHaveBeenCalled();
    });

    it('should revoke share link', async () => {
      // Arrange
      const shareToken = 'token-123';
      jest.spyOn(prisma.resumeShareLink, 'update').mockResolvedValue({
        id: 'share-1',
        revokedAt: new Date(),
      } as any);

      // Act
      await SharingService.revokeShareLink(shareToken);

      // Assert
      expect(prisma.resumeShareLink.update).toHaveBeenCalledWith({
        where: { shareToken },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should calculate share summary correctly', async () => {
      // Arrange
      const resumeId = 'resume-1';
      const now = new Date();
      const mockShareLinks = [
        {
          id: 'share-1',
          resumeId,
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
          resumeId,
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
          resumeId,
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

      jest.spyOn(prisma.resumeShareLink, 'findMany').mockResolvedValue(mockShareLinks as any);

      // Act
      const summary = await SharingService.getShareSummary(resumeId);

      // Assert
      expect(summary.totalShares).toBe(3);
      expect(summary.activeLinks).toBe(1); // Only token-1 is active
      expect(summary.expiredLinks).toBe(1); // Only token-2 is expired
    });

    it('should retrieve all share links for a resume', async () => {
      // Arrange
      const resumeId = 'resume-1';
      const mockShareLinks = [
        {
          id: 'share-1',
          resumeId,
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
          resumeId,
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

      jest.spyOn(prisma.resumeShareLink, 'findMany').mockResolvedValue(mockShareLinks as any);

      // Act
      const shareLinks = await SharingService.getShareLinks(resumeId);

      // Assert
      expect(shareLinks).toHaveLength(2);
      expect(shareLinks[0].recipientEmail).toBe('recipient1@example.com');
      expect(shareLinks[1].recipientEmail).toBe('recipient2@example.com');
    });

    it('should handle multiple recipients correctly', async () => {
      // Arrange
      const resumeId = 'resume-1';
      const senderId = 'user-1';
      const recipients = [
        'recipient1@example.com',
        'recipient2@example.com',
        'recipient3@example.com',
      ];

      const mockResume = {
        id: resumeId,
        title: 'Test Resume',
        user: { id: senderId, name: 'Test User' },
      };

      const mockUser = {
        id: senderId,
        name: 'Test User',
        email: 'sender@example.com',
      };

      jest.spyOn(prisma.resume, 'findUnique').mockResolvedValue(mockResume as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.resumeShareLink, 'create').mockImplementation(({ data }) => {
        return Promise.resolve({
          id: `share-${Math.random()}`,
          ...data,
          createdAt: new Date(),
          viewCount: 0,
        } as any);
      });

      // Act
      const shareLinks = await SharingService.createShareLink(
        resumeId,
        senderId,
        recipients,
        30
      );

      // Assert
      expect(shareLinks).toHaveLength(3);
      expect(shareLinks.map(link => link.recipientEmail)).toEqual(recipients);
      expect(prisma.resumeShareLink.create).toHaveBeenCalledTimes(3);
    });

    it('should calculate remaining time correctly', () => {
      // Arrange
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 30 * 60 * 1000);

      // Act
      const remaining = SharingService.getRemainingTime(expiresAt);

      // Assert
      expect(remaining.days).toBe(5);
      expect(remaining.hours).toBe(3);
      expect(remaining.minutes).toBe(30);
      expect(remaining.isExpired).toBe(false);
    });

    it('should mark as expired for past dates', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 1000);

      // Act
      const remaining = SharingService.getRemainingTime(pastDate);

      // Assert
      expect(remaining.isExpired).toBe(true);
      expect(remaining.days).toBe(0);
      expect(remaining.hours).toBe(0);
      expect(remaining.minutes).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle resume not found error', async () => {
      // Arrange
      jest.spyOn(prisma.resume, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        SharingService.createShareLink('invalid-id', 'user-1', ['recipient@example.com'])
      ).rejects.toThrow('Resume not found');
    });

    it('should handle sender not found error', async () => {
      // Arrange
      const mockResume = {
        id: 'resume-1',
        title: 'Test Resume',
        user: { id: 'user-1', name: 'Test User' },
      };

      jest.spyOn(prisma.resume, 'findUnique').mockResolvedValue(mockResume as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        SharingService.createShareLink('resume-1', 'invalid-user', ['recipient@example.com'])
      ).rejects.toThrow('Sender not found');
    });

    it('should handle share link not found error on extend', async () => {
      // Arrange
      jest.spyOn(prisma.resumeShareLink, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        SharingService.extendExpiration('invalid-token', 20)
      ).rejects.toThrow('Share link not found');
    });
  });
});
