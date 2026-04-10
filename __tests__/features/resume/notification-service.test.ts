import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { notificationService } from "@/features/resume/notification-service";
import { prisma } from "@/lib/prisma";
import * as emailLib from "@/lib/email";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    resume: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    resumeNotification: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

describe("NotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("should create a view notification when notifications are enabled", async () => {
      const resumeId = "resume-1";
      const userId = "user-1";
      const metadata = {
        viewerEmail: "viewer@example.com",
        viewerName: "John Viewer",
        deviceType: "desktop",
      };

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId,
      } as any);

      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue({
        userId,
        viewNotifications: true,
        downloadNotifications: true,
        emailNotifications: true,
        aggregateViews: true,
      } as any);

      vi.mocked(prisma.resumeNotification.findFirst).mockResolvedValue(null);

      vi.mocked(prisma.resumeNotification.create).mockResolvedValue({
        id: "notif-1",
        userId,
        resumeId,
        type: "view",
        viewerEmail: metadata.viewerEmail,
        viewerName: metadata.viewerName,
        aggregatedCount: 1,
        isRead: false,
        emailSent: false,
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email: "user@example.com",
        name: "User Name",
      } as any);

      vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({
        id: resumeId,
        title: "My Resume",
      } as any);

      await notificationService.createNotification(resumeId, "view", metadata);

      expect(prisma.resumeNotification.create).toHaveBeenCalledWith({
        data: {
          userId,
          resumeId,
          type: "view",
          viewerEmail: metadata.viewerEmail,
          viewerName: metadata.viewerName,
          aggregatedCount: 1,
          isRead: false,
          emailSent: false,
        },
      });
    });

    it("should not create notification when view notifications are disabled", async () => {
      const resumeId = "resume-1";
      const userId = "user-1";

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId,
      } as any);

      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue({
        userId,
        viewNotifications: false,
        downloadNotifications: true,
        emailNotifications: true,
        aggregateViews: true,
      } as any);

      await notificationService.createNotification(resumeId, "view", {});

      expect(prisma.resumeNotification.create).not.toHaveBeenCalled();
    });

    it("should aggregate notifications from same viewer within 1 hour", async () => {
      const resumeId = "resume-1";
      const userId = "user-1";
      const viewerEmail = "viewer@example.com";

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId,
      } as any);

      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue({
        userId,
        viewNotifications: true,
        downloadNotifications: true,
        emailNotifications: true,
        aggregateViews: true,
      } as any);

      const existingNotif = {
        id: "notif-1",
        aggregatedCount: 2,
      };

      vi.mocked(prisma.resumeNotification.findFirst).mockResolvedValue(
        existingNotif as any
      );

      vi.mocked(prisma.resumeNotification.update).mockResolvedValue({
        id: "notif-1",
        aggregatedCount: 3,
      } as any);

      await notificationService.createNotification(resumeId, "view", {
        viewerEmail,
      });

      expect(prisma.resumeNotification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: {
          aggregatedCount: 3,
          createdAt: expect.any(Date),
        },
      });

      expect(prisma.resumeNotification.create).not.toHaveBeenCalled();
    });

    it("should handle resume not found error gracefully", async () => {
      vi.mocked(prisma.resume.findUnique).mockResolvedValue(null);

      // Should not throw
      await expect(
        notificationService.createNotification("invalid-id", "view", {})
      ).resolves.not.toThrow();

      expect(prisma.resumeNotification.create).not.toHaveBeenCalled();
    });
  });

  describe("getNotifications", () => {
    it("should retrieve notifications with pagination", async () => {
      const userId = "user-1";
      const notifications = [
        {
          id: "notif-1",
          userId,
          resumeId: "resume-1",
          type: "view",
          aggregatedCount: 1,
          isRead: false,
          emailSent: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.resumeNotification.findMany).mockResolvedValue(
        notifications as any
      );
      vi.mocked(prisma.resumeNotification.count).mockResolvedValue(1);

      const result = await notificationService.getNotifications(userId, 20, 0);

      expect(result.notifications).toEqual(notifications);
      expect(result.total).toBe(1);
      expect(prisma.resumeNotification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        skip: 0,
      });
    });

    it("should respect limit parameter", async () => {
      const userId = "user-1";

      vi.mocked(prisma.resumeNotification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.resumeNotification.count).mockResolvedValue(0);

      await notificationService.getNotifications(userId, 50, 10);

      expect(prisma.resumeNotification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        skip: 10,
      });
    });

    it("should cap limit at 100", async () => {
      const userId = "user-1";

      vi.mocked(prisma.resumeNotification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.resumeNotification.count).mockResolvedValue(0);

      await notificationService.getNotifications(userId, 200, 0);

      expect(prisma.resumeNotification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        skip: 0,
      });
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const notificationId = "notif-1";

      vi.mocked(prisma.resumeNotification.update).mockResolvedValue({
        id: notificationId,
        isRead: true,
      } as any);

      await notificationService.markAsRead(notificationId);

      expect(prisma.resumeNotification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { isRead: true },
      });
    });
  });

  describe("getNotificationPreferences", () => {
    it("should return existing preferences", async () => {
      const userId = "user-1";
      const preferences = {
        userId,
        viewNotifications: true,
        downloadNotifications: false,
        emailNotifications: true,
        aggregateViews: true,
      };

      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue(
        preferences as any
      );

      const result = await notificationService.getNotificationPreferences(
        userId
      );

      expect(result).toEqual({
        viewNotifications: true,
        downloadNotifications: false,
        emailNotifications: true,
        aggregateViews: true,
      });
    });

    it("should create default preferences if none exist", async () => {
      const userId = "user-1";

      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue(
        null
      );

      vi.mocked(prisma.notificationPreference.create).mockResolvedValue({
        userId,
        viewNotifications: true,
        downloadNotifications: true,
        emailNotifications: true,
        aggregateViews: true,
      } as any);

      const result = await notificationService.getNotificationPreferences(
        userId
      );

      expect(result).toEqual({
        viewNotifications: true,
        downloadNotifications: true,
        emailNotifications: true,
        aggregateViews: true,
      });

      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: {
          userId,
          viewNotifications: true,
          downloadNotifications: true,
          emailNotifications: true,
          aggregateViews: true,
        },
      });
    });

    it("should return defaults on error", async () => {
      const userId = "user-1";

      vi.mocked(prisma.notificationPreference.findUnique).mockRejectedValue(
        new Error("Database error")
      );

      const result = await notificationService.getNotificationPreferences(
        userId
      );

      expect(result).toEqual({
        viewNotifications: true,
        downloadNotifications: true,
        emailNotifications: true,
        aggregateViews: true,
      });
    });
  });

  describe("updateNotificationPreferences", () => {
    it("should update existing preferences", async () => {
      const userId = "user-1";
      const updates = {
        viewNotifications: false,
        emailNotifications: false,
      };

      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValue({
        userId,
        viewNotifications: false,
        downloadNotifications: true,
        emailNotifications: false,
        aggregateViews: true,
      } as any);

      const result = await notificationService.updateNotificationPreferences(
        userId,
        updates
      );

      expect(result).toEqual({
        viewNotifications: false,
        downloadNotifications: true,
        emailNotifications: false,
        aggregateViews: true,
      });
    });

    it("should create preferences if they don't exist", async () => {
      const userId = "user-1";
      const updates = {
        viewNotifications: false,
      };

      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValue({
        userId,
        viewNotifications: false,
        downloadNotifications: true,
        emailNotifications: true,
        aggregateViews: true,
      } as any);

      await notificationService.updateNotificationPreferences(userId, updates);

      expect(prisma.notificationPreference.upsert).toHaveBeenCalled();
    });
  });

  describe("getUnreadCount", () => {
    it("should return count of unread notifications", async () => {
      const userId = "user-1";

      vi.mocked(prisma.resumeNotification.count).mockResolvedValue(5);

      const count = await notificationService.getUnreadCount(userId);

      expect(count).toBe(5);
      expect(prisma.resumeNotification.count).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
      });
    });

    it("should return 0 on error", async () => {
      const userId = "user-1";

      vi.mocked(prisma.resumeNotification.count).mockRejectedValue(
        new Error("Database error")
      );

      const count = await notificationService.getUnreadCount(userId);

      expect(count).toBe(0);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      const userId = "user-1";

      vi.mocked(prisma.resumeNotification.updateMany).mockResolvedValue({
        count: 3,
      } as any);

      await notificationService.markAllAsRead(userId);

      expect(prisma.resumeNotification.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    });
  });

  describe("deleteOldNotifications", () => {
    it("should delete notifications older than specified days", async () => {
      vi.mocked(prisma.resumeNotification.deleteMany).mockResolvedValue({
        count: 10,
      } as any);

      const deleted = await notificationService.deleteOldNotifications(30);

      expect(deleted).toBe(10);
      expect(prisma.resumeNotification.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it("should use default 30 days if not specified", async () => {
      vi.mocked(prisma.resumeNotification.deleteMany).mockResolvedValue({
        count: 5,
      } as any);

      await notificationService.deleteOldNotifications();

      expect(prisma.resumeNotification.deleteMany).toHaveBeenCalled();
    });
  });

  describe("sendNotificationEmail", () => {
    it("should send email notification with viewer info", async () => {
      const userId = "user-1";
      const notification = {
        id: "notif-1",
        userId,
        resumeId: "resume-1",
        type: "view" as const,
        viewerEmail: "viewer@example.com",
        viewerName: "John Viewer",
        aggregatedCount: 1,
        isRead: false,
        emailSent: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email: "user@example.com",
        name: "User Name",
      } as any);

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: "resume-1",
        title: "My Resume",
      } as any);

      vi.mocked(prisma.resumeNotification.update).mockResolvedValue(
        notification as any
      );

      await notificationService.sendNotificationEmail(userId, notification);

      expect(emailLib.sendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: expect.stringContaining("viewed"),
        html: expect.stringContaining("John Viewer"),
      });

      expect(prisma.resumeNotification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { emailSent: true },
      });
    });

    it("should handle aggregated notifications", async () => {
      const userId = "user-1";
      const notification = {
        id: "notif-1",
        userId,
        resumeId: "resume-1",
        type: "view" as const,
        viewerEmail: "viewer@example.com",
        viewerName: "John Viewer",
        aggregatedCount: 5,
        isRead: false,
        emailSent: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email: "user@example.com",
        name: "User Name",
      } as any);

      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: "resume-1",
        title: "My Resume",
      } as any);

      vi.mocked(prisma.resumeNotification.update).mockResolvedValue(
        notification as any
      );

      await notificationService.sendNotificationEmail(userId, notification);

      expect(emailLib.sendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: expect.stringContaining("5 people"),
        html: expect.any(String),
      });
    });

    it("should handle missing user gracefully", async () => {
      const userId = "user-1";
      const notification = {
        id: "notif-1",
        userId,
        resumeId: "resume-1",
        type: "view" as const,
        viewerEmail: "viewer@example.com",
        viewerName: "John Viewer",
        aggregatedCount: 1,
        isRead: false,
        emailSent: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Should not throw
      await expect(
        notificationService.sendNotificationEmail(userId, notification)
      ).resolves.not.toThrow();

      expect(emailLib.sendEmail).not.toHaveBeenCalled();
    });
  });
});
