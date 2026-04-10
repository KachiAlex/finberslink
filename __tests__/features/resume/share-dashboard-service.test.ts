import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { shareDashboardService } from "@/features/resume/share-dashboard-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    resumeShareLink: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe("ShareDashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getShareLinksWithDetails", () => {
    it("should retrieve all share links with calculated status and remaining days", async () => {
      const resumeId = "resume-1";
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const shareLinks = [
        {
          id: "link-1",
          shareToken: "token-1",
          recipientEmail: "user1@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: now,
        },
        {
          id: "link-2",
          shareToken: "token-2",
          recipientEmail: "user2@example.com",
          createdAt: now,
          expiresAt: pastDate,
          revokedAt: null,
          viewCount: 3,
          lastViewedAt: null,
        },
        {
          id: "link-3",
          shareToken: "token-3",
          recipientEmail: "user3@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: now,
          viewCount: 2,
          lastViewedAt: null,
        },
      ];

      vi.mocked(prisma.resumeShareLink.findMany).mockResolvedValue(
        shareLinks as any
      );

      const result = await shareDashboardService.getShareLinksWithDetails(
        resumeId
      );

      expect(result.links).toHaveLength(3);
      expect(result.links[0].status).toBe("active");
      expect(result.links[1].status).toBe("expired");
      expect(result.links[2].status).toBe("revoked");

      expect(result.summary.totalShares).toBe(3);
      expect(result.summary.activeLinks).toBe(1);
      expect(result.summary.expiredLinks).toBe(1);
      expect(result.summary.revokedLinks).toBe(1);
      expect(result.summary.totalViews).toBe(10);
    });

    it("should calculate remaining days correctly", async () => {
      const resumeId = "resume-1";
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

      vi.mocked(prisma.resumeShareLink.findMany).mockResolvedValue([
        {
          id: "link-1",
          shareToken: "token-1",
          recipientEmail: "user@example.com",
          createdAt: now,
          expiresAt,
          revokedAt: null,
          viewCount: 0,
          lastViewedAt: null,
        },
      ] as any);

      const result = await shareDashboardService.getShareLinksWithDetails(
        resumeId
      );

      expect(result.links[0].remainingDays).toBe(5);
    });
  });

  describe("getShareLinksByStatus", () => {
    it("should filter share links by status", async () => {
      const resumeId = "resume-1";
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.resumeShareLink.findMany).mockResolvedValue([
        {
          id: "link-1",
          shareToken: "token-1",
          recipientEmail: "user1@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: now,
        },
        {
          id: "link-2",
          shareToken: "token-2",
          recipientEmail: "user2@example.com",
          createdAt: now,
          expiresAt: pastDate,
          revokedAt: null,
          viewCount: 3,
          lastViewedAt: null,
        },
      ] as any);

      const activeLinks = await shareDashboardService.getShareLinksByStatus(
        resumeId,
        "active"
      );

      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0].status).toBe("active");

      const expiredLinks = await shareDashboardService.getShareLinksByStatus(
        resumeId,
        "expired"
      );

      expect(expiredLinks).toHaveLength(1);
      expect(expiredLinks[0].status).toBe("expired");
    });
  });

  describe("getShareLinkByToken", () => {
    it("should retrieve share link by token", async () => {
      const shareToken = "token-1";
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.resumeShareLink.findUnique).mockResolvedValue({
        id: "link-1",
        shareToken,
        recipientEmail: "user@example.com",
        createdAt: now,
        expiresAt: futureDate,
        revokedAt: null,
        viewCount: 5,
        lastViewedAt: now,
      } as any);

      const result = await shareDashboardService.getShareLinkByToken(
        shareToken
      );

      expect(result).not.toBeNull();
      expect(result?.shareToken).toBe(shareToken);
      expect(result?.status).toBe("active");
    });

    it("should return null if token not found", async () => {
      vi.mocked(prisma.resumeShareLink.findUnique).mockResolvedValue(null);

      const result = await shareDashboardService.getShareLinkByToken(
        "invalid-token"
      );

      expect(result).toBeNull();
    });
  });

  describe("getShareSummary", () => {
    it("should return share summary statistics", async () => {
      const resumeId = "resume-1";
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.resumeShareLink.findMany).mockResolvedValue([
        {
          id: "link-1",
          shareToken: "token-1",
          recipientEmail: "user1@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 10,
          lastViewedAt: now,
        },
        {
          id: "link-2",
          shareToken: "token-2",
          recipientEmail: "user2@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: now,
        },
      ] as any);

      const summary = await shareDashboardService.getShareSummary(resumeId);

      expect(summary.totalShares).toBe(2);
      expect(summary.activeLinks).toBe(2);
      expect(summary.totalViews).toBe(15);
    });
  });

  describe("getMostRecentlyViewed", () => {
    it("should return most recently viewed share links", async () => {
      const resumeId = "resume-1";
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const recentTime = new Date(now.getTime() - 1 * 60 * 1000); // 1 minute ago
      const olderTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

      vi.mocked(prisma.resumeShareLink.findMany).mockResolvedValue([
        {
          id: "link-1",
          shareToken: "token-1",
          recipientEmail: "user1@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: olderTime,
        },
        {
          id: "link-2",
          shareToken: "token-2",
          recipientEmail: "user2@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 3,
          lastViewedAt: recentTime,
        },
      ] as any);

      const result = await shareDashboardService.getMostRecentlyViewed(
        resumeId,
        5
      );

      expect(result).toHaveLength(2);
      expect(result[0].lastViewedAt).toEqual(recentTime);
    });
  });

  describe("getMostViewed", () => {
    it("should return most viewed share links", async () => {
      const resumeId = "resume-1";
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.resumeShareLink.findMany).mockResolvedValue([
        {
          id: "link-1",
          shareToken: "token-1",
          recipientEmail: "user1@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: now,
        },
        {
          id: "link-2",
          shareToken: "token-2",
          recipientEmail: "user2@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 15,
          lastViewedAt: now,
        },
      ] as any);

      const result = await shareDashboardService.getMostViewed(resumeId, 5);

      expect(result).toHaveLength(2);
      expect(result[0].viewCount).toBe(15);
      expect(result[1].viewCount).toBe(5);
    });
  });

  describe("getExpiringLinks", () => {
    it("should return links expiring within specified days", async () => {
      const resumeId = "resume-1";
      const now = new Date();
      const expiringDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days

      vi.mocked(prisma.resumeShareLink.findMany).mockResolvedValue([
        {
          id: "link-1",
          shareToken: "token-1",
          recipientEmail: "user1@example.com",
          createdAt: now,
          expiresAt: expiringDate,
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: now,
        },
        {
          id: "link-2",
          shareToken: "token-2",
          recipientEmail: "user2@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 3,
          lastViewedAt: now,
        },
      ] as any);

      const result = await shareDashboardService.getExpiringLinks(resumeId, 7);

      expect(result).toHaveLength(1);
      expect(result[0].remainingDays).toBeLessThanOrEqual(7);
    });
  });

  describe("getPerformanceMetrics", () => {
    it("should calculate performance metrics", async () => {
      const resumeId = "resume-1";
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.resumeShareLink.findMany).mockResolvedValue([
        {
          id: "link-1",
          shareToken: "token-1",
          recipientEmail: "user1@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 10,
          lastViewedAt: now,
        },
        {
          id: "link-2",
          shareToken: "token-2",
          recipientEmail: "user2@example.com",
          createdAt: now,
          expiresAt: futureDate,
          revokedAt: null,
          viewCount: 5,
          lastViewedAt: now,
        },
      ] as any);

      const metrics = await shareDashboardService.getPerformanceMetrics(
        resumeId
      );

      expect(metrics.summary.totalViews).toBe(15);
      expect(metrics.avgViewsPerLink).toBe(7.5);
      expect(metrics.mostViewedLink.viewCount).toBe(10);
      expect(metrics.totalActiveLinks).toBe(2);
    });
  });

  describe("cleanupExpiredLinks", () => {
    it("should delete expired share links", async () => {
      const resumeId = "resume-1";

      vi.mocked(prisma.resumeShareLink.deleteMany).mockResolvedValue({
        count: 3,
      } as any);

      const deleted = await shareDashboardService.cleanupExpiredLinks(
        resumeId
      );

      expect(deleted).toBe(3);
      expect(prisma.resumeShareLink.deleteMany).toHaveBeenCalledWith({
        where: {
          resumeId,
          expiresAt: {
            lt: expect.any(Date),
          },
          revokedAt: null,
        },
      });
    });
  });
});
