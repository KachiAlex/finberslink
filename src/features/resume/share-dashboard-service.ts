import { prisma } from "@/lib/prisma";

export interface ShareLinkDetail {
  id: string;
  shareToken: string;
  recipientEmail?: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;
  status: "active" | "expired" | "revoked";
  remainingDays: number;
}

export interface ShareSummary {
  totalShares: number;
  activeLinks: number;
  expiredLinks: number;
  revokedLinks: number;
  totalViews: number;
}

export class ShareDashboardService {
  /**
   * Get all share links for a resume with details
   * Implements Requirement 8.1, 8.2, 8.3
   */
  async getShareLinksWithDetails(
    resumeId: string
  ): Promise<{ links: ShareLinkDetail[]; summary: ShareSummary }> {
    try {
      const shareLinks = await prisma.resumeShareLink.findMany({
        where: { resumeId },
        orderBy: { createdAt: "desc" },
      });

      const now = new Date();
      const links: ShareLinkDetail[] = shareLinks.map((link) => {
        let status: "active" | "expired" | "revoked" = "active";
        if (link.revokedAt) {
          status = "revoked";
        } else if (link.expiresAt < now) {
          status = "expired";
        }

        const remainingMs = link.expiresAt.getTime() - now.getTime();
        const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

        return {
          id: link.id,
          shareToken: link.shareToken,
          recipientEmail: link.recipientEmail,
          createdAt: link.createdAt,
          expiresAt: link.expiresAt,
          revokedAt: link.revokedAt,
          viewCount: link.viewCount,
          lastViewedAt: link.lastViewedAt,
          status,
          remainingDays,
        };
      });

      // Calculate summary
      const summary: ShareSummary = {
        totalShares: links.length,
        activeLinks: links.filter((l) => l.status === "active").length,
        expiredLinks: links.filter((l) => l.status === "expired").length,
        revokedLinks: links.filter((l) => l.status === "revoked").length,
        totalViews: links.reduce((sum, l) => sum + l.viewCount, 0),
      };

      return { links, summary };
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error getting share links for resume ${resumeId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get share links filtered by status
   * Implements Requirement 8.4, 8.7
   */
  async getShareLinksByStatus(
    resumeId: string,
    status: "active" | "expired" | "revoked"
  ): Promise<ShareLinkDetail[]> {
    try {
      const allLinks = await this.getShareLinksWithDetails(resumeId);
      return allLinks.links.filter((link) => link.status === status);
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error filtering share links by status:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get share link details by token
   */
  async getShareLinkByToken(shareToken: string): Promise<ShareLinkDetail | null> {
    try {
      const link = await prisma.resumeShareLink.findUnique({
        where: { shareToken },
      });

      if (!link) {
        return null;
      }

      const now = new Date();
      let status: "active" | "expired" | "revoked" = "active";
      if (link.revokedAt) {
        status = "revoked";
      } else if (link.expiresAt < now) {
        status = "expired";
      }

      const remainingMs = link.expiresAt.getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

      return {
        id: link.id,
        shareToken: link.shareToken,
        recipientEmail: link.recipientEmail,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        revokedAt: link.revokedAt,
        viewCount: link.viewCount,
        lastViewedAt: link.lastViewedAt,
        status,
        remainingDays,
      };
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error getting share link by token:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get share summary statistics
   * Implements Requirement 8.8
   */
  async getShareSummary(resumeId: string): Promise<ShareSummary> {
    try {
      const { summary } = await this.getShareLinksWithDetails(resumeId);
      return summary;
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error getting share summary:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get most recently viewed share links
   */
  async getMostRecentlyViewed(
    resumeId: string,
    limit: number = 5
  ): Promise<ShareLinkDetail[]> {
    try {
      const { links } = await this.getShareLinksWithDetails(resumeId);
      return links
        .filter((l) => l.lastViewedAt)
        .sort((a, b) => {
          const aTime = a.lastViewedAt?.getTime() || 0;
          const bTime = b.lastViewedAt?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, limit);
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error getting recently viewed links:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get most viewed share links
   */
  async getMostViewed(
    resumeId: string,
    limit: number = 5
  ): Promise<ShareLinkDetail[]> {
    try {
      const { links } = await this.getShareLinksWithDetails(resumeId);
      return links
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit);
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error getting most viewed links:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get share links expiring soon
   */
  async getExpiringLinks(
    resumeId: string,
    daysUntilExpiry: number = 7
  ): Promise<ShareLinkDetail[]> {
    try {
      const { links } = await this.getShareLinksWithDetails(resumeId);
      return links.filter(
        (l) => l.status === "active" && l.remainingDays <= daysUntilExpiry
      );
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error getting expiring links:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get share link performance metrics
   */
  async getPerformanceMetrics(resumeId: string) {
    try {
      const { links, summary } = await this.getShareLinksWithDetails(resumeId);

      const avgViewsPerLink =
        links.length > 0 ? summary.totalViews / links.length : 0;
      const mostViewedLink = links.reduce((max, link) =>
        link.viewCount > max.viewCount ? link : max
      );

      return {
        summary,
        avgViewsPerLink: Math.round(avgViewsPerLink * 100) / 100,
        mostViewedLink,
        totalActiveLinks: summary.activeLinks,
        expiringLinks: await this.getExpiringLinks(resumeId, 7),
      };
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error getting performance metrics:`,
        error
      );
      throw error;
    }
  }

  /**
   * Clean up expired share links
   */
  async cleanupExpiredLinks(resumeId: string): Promise<number> {
    try {
      const now = new Date();
      const result = await prisma.resumeShareLink.deleteMany({
        where: {
          resumeId,
          expiresAt: {
            lt: now,
          },
          revokedAt: null, // Only delete expired, not revoked
        },
      });

      return result.count;
    } catch (error) {
      console.error(
        `[ShareDashboardService] Error cleaning up expired links:`,
        error
      );
      throw error;
    }
  }
}

export const shareDashboardService = new ShareDashboardService();
