import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export interface ShareLink {
  id: string;
  resumeId: string;
  shareToken: string;
  recipientEmail?: string;
  senderId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;
}

export interface ShareSummary {
  totalShares: number;
  activeLinks: number;
  expiredLinks: number;
}

/**
 * Sharing Service
 * Manages share links, expiration, and access control
 */
export class SharingService {
  /**
   * Generate cryptographically secure share token
   */
  static generateShareToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create share link(s) for a resume
   */
  static async createShareLink(
    resumeId: string,
    senderId: string,
    recipients: string[],
    expirationDays?: number
  ): Promise<ShareLink[]> {
    try {
      // Validate resume exists
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      // Default to 30 days if not specified
      const days = expirationDays || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      // Create share link for each recipient
      const shareLinks = await Promise.all(
        recipients.map(email =>
          prisma.resumeShareLink.create({
            data: {
              resumeId,
              senderId,
              recipientEmail: email,
              shareToken: this.generateShareToken(),
              expiresAt,
            },
          })
        )
      );

      return shareLinks;
    } catch (error) {
      throw new Error(`Failed to create share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all share links for a resume
   */
  static async getShareLinks(resumeId: string): Promise<ShareLink[]> {
    try {
      const shareLinks = await prisma.resumeShareLink.findMany({
        where: { resumeId },
        orderBy: { createdAt: 'desc' },
      });

      return shareLinks;
    } catch (error) {
      throw new Error(`Failed to retrieve share links: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate share token (check expiration and revocation)
   */
  static async validateShareToken(shareToken: string): Promise<boolean> {
    try {
      const shareLink = await prisma.resumeShareLink.findUnique({
        where: { shareToken },
      });

      if (!shareLink) {
        return false;
      }

      // Check if revoked
      if (shareLink.revokedAt) {
        return false;
      }

      // Check if expired
      if (new Date() > shareLink.expiresAt) {
        return false;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to validate share token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get share link details
   */
  static async getShareLinkDetails(shareToken: string): Promise<ShareLink | null> {
    try {
      const shareLink = await prisma.resumeShareLink.findUnique({
        where: { shareToken },
      });

      return shareLink;
    } catch (error) {
      throw new Error(`Failed to retrieve share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extend share link expiration
   */
  static async extendExpiration(shareToken: string, additionalDays: number): Promise<Date> {
    try {
      const shareLink = await prisma.resumeShareLink.findUnique({
        where: { shareToken },
      });

      if (!shareLink) {
        throw new Error(`Share link not found: ${shareToken}`);
      }

      const newExpiresAt = new Date(shareLink.expiresAt);
      newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

      const updated = await prisma.resumeShareLink.update({
        where: { shareToken },
        data: { expiresAt: newExpiresAt },
      });

      return updated.expiresAt;
    } catch (error) {
      throw new Error(`Failed to extend expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revoke share link
   */
  static async revokeShareLink(shareToken: string): Promise<void> {
    try {
      await prisma.resumeShareLink.update({
        where: { shareToken },
        data: { revokedAt: new Date() },
      });
    } catch (error) {
      throw new Error(`Failed to revoke share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record view on share link
   */
  static async recordShareLinkView(shareToken: string): Promise<void> {
    try {
      await prisma.resumeShareLink.update({
        where: { shareToken },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to record view: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get share summary for a resume
   */
  static async getShareSummary(resumeId: string): Promise<ShareSummary> {
    try {
      const shareLinks = await prisma.resumeShareLink.findMany({
        where: { resumeId },
      });

      const now = new Date();
      const activeLinks = shareLinks.filter(
        link => !link.revokedAt && link.expiresAt > now
      ).length;
      const expiredLinks = shareLinks.filter(
        link => !link.revokedAt && link.expiresAt <= now
      ).length;

      return {
        totalShares: shareLinks.length,
        activeLinks,
        expiredLinks,
      };
    } catch (error) {
      throw new Error(`Failed to calculate share summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get remaining time until expiration
   */
  static getRemainingTime(expiresAt: Date): {
    days: number;
    hours: number;
    minutes: number;
    isExpired: boolean;
  } {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, isExpired: false };
  }

  /**
   * Delete expired share links (cleanup job)
   */
  static async deleteExpiredShareLinks(): Promise<number> {
    try {
      const result = await prisma.resumeShareLink.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          revokedAt: { not: null },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(`Failed to delete expired share links: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
