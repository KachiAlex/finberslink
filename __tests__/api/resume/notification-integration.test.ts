import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { notificationService } from "@/features/resume/notification-service";
import { prisma } from "@/lib/prisma";
import * as emailLib from "@/lib/email";

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

describe("Notification Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Full notification flow", () => {
    it("should create notification and send email on resume view", async () => {
      const resumeId = "resume-1";
      const userId = "user-1";
      const viewerEmail = "recruiter@company.com";
      const viewerName = "Jane Recruiter";

      // Step 1: Resume view triggers notification creation
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

      const createdNotification = {
        id: "notif-1",
        userId,
        resumeId,
        type: "view",
        viewerEmail,
        viewerName,
        aggregatedCount: 1,
        isRead: false,
        emailSent: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.resumeNotification.create).mockResolvedValue(
        createdNotification as any
      );

      // Step 2: Email is sent
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email: "user@example.com",
        name: "John Job Seeker",
      } as any);

      vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({
        id: resumeId,
        title: "Senior Developer Resume",
      } as any);

      vi.mocked(prisma.resumeNotification.update).mockResolvedValue(
        { ...createdNotification, emailSent: true } as any
      );

      // Execute
      await notificationService.createNotification(resumeId, "view", {
        viewerEmail,
        viewerName,
        deviceType: "desktop",
        browser: "Chrome",
      });

      // Verify notification was created
      expect(prisma.resumeNotification.create).toHaveBeenCalledWith({
        data: {
          userId,
          resumeId,
          type: "view",
          viewerEmail,
          viewerName,
          aggregatedCount: 1,
          isRead: false,
          emailSent: false,
        },
      });

      // Verify email was sent
      expect(emailLib.sendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: expect.stringContaining("viewed"),
        html: expect.stringContaining("Jane Recruiter"),
      });
    });

    it("should aggregate multiple views from same viewer", async () => {
      const resumeId = "resume-1";
      const userId = "user-1";
      const viewerEmail = "recruiter@company.com";

      // First view
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
        viewerEmail,
        aggregatedCount: 1,
        isRead: false,
        emailSent: false,
        createdAt: new Date(),
      } as any);

      await notificationService.createNotification(resumeId, "view", {
        viewerEmail,
      });

      // Second view from same viewer within 1 hour
      vi.mocked(prisma.resumeNotification.findFirst).mockResolvedValue({
        id: "notif-1",
        aggregatedCount: 1,
      } as any);

      vi.mocked(prisma.resumeNotification.update).mockResolvedValue({
        id: "notif-1",
        aggregatedCount: 2,
      } as any);

      await notificationService.createNotification(resumeId, "view", {
        viewerEmail,
      });

      // Verify aggregation
      expect(prisma.resumeNotification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: {
          aggregatedCount: 2,
          createdAt: expect.any(Date),
        },
      });

      // Should not create new notification
      expect(prisma.resumeNotification.create).toHaveBeenCalledTimes(1);
    });

    it("should respect notification preferences", async () => {
      const resumeId = "resume-1";
      const userId = "user-1";

      // User has disabled view notifications
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

      await notificationService.createNotification(resumeId, "view", {
        viewerEmail: "recruiter@company.com",
      });

      // Should not create notification
      expect(prisma.resumeNotification.create).not.toHaveBeenCalled();
      expect(emailLib.sendEmail).not.toHaveBeenCalled();
    });

    it("should handle download notifications", async () => {
      const resumeId = "resume-1";
      const userId = "user-1";

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
        id: "notif-2",
        userId,
        resumeId,
        type: "download",
        viewerEmail: "recruiter@company.com",
        aggregatedCount: 1,
        isRead: false,
        emailSent: false,
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        email: "user@example.com",
        name: "John Job Seeker",
      } as any);

      vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({
        id: resumeId,
        title: "My Resume",
      } as any);

      vi.mocked(prisma.resumeNotification.update).mockResolvedValue({
        id: "notif-2",
        emailSent: true,
      } as any);

      await notificationService.createNotification(resumeId, "download", {
        viewerEmail: "recruiter@company.com",
      });

      expect(prisma.resumeNotification.create).toHaveBeenCalledWith({
        data: {
          userId,
          resumeId,
          type: "download",
          viewerEmail: "recruiter@company.com",
          viewerName: undefined,
          aggregatedCount: 1,
          isRead: false,
          emailSent: false,
        },
      });

      expect(emailLib.sendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: expect.stringContaining("downloaded"),
        html: expect.any(String),
      });
    });
  });

  describe("Notification management", () => {
    it("should retrieve and mark notifications as read", async () => {
      const userId = "user-1";
      const notifications = [
        {
          id: "notif-1",
          userId,
          resumeId: "resume-1",
          type: "view",
          viewerEmail: "recruiter@company.com",
          aggregatedCount: 1,
          isRead: false,
          emailSent: true,
          createdAt: new Date(),
        },
        {
          id: "notif-2",
          userId,
          resumeId: "resume-1",
          type: "download",
          viewerEmail: "recruiter@company.com",
          aggregatedCount: 1,
          isRead: false,
          emailSent: true,
          createdAt: new Date(),
        },
      ];

      // Get notifications
      vi.mocked(prisma.resumeNotification.findMany).mockResolvedValue(
        notifications as any
      );
      vi.mocked(prisma.resumeNotification.count).mockResolvedValue(2);

      const result = await notificationService.getNotifications(userId, 20, 0);

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);

      // Mark first as read
      vi.mocked(prisma.resumeNotification.update).mockResolvedValue({
        ...notifications[0],
        isRead: true,
      } as any);

      await notificationService.markAsRead("notif-1");

      expect(prisma.resumeNotification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { isRead: true },
      });
    });

    it("should get unread count", async () => {
      const userId = "user-1";

      vi.mocked(prisma.resumeNotification.count).mockResolvedValue(3);

      const count = await notificationService.getUnreadCount(userId);

      expect(count).toBe(3);
    });

    it("should mark all notifications as read", async () => {
      const userId = "user-1";

      vi.mocked(prisma.resumeNotification.updateMany).mockResolvedValue({
        count: 5,
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

  describe("Notification preferences", () => {
    it("should update notification preferences", async () => {
      const userId = "user-1";

      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValue({
        userId,
        viewNotifications: false,
        downloadNotifications: true,
        emailNotifications: false,
        aggregateViews: true,
      } as any);

      const result = await notificationService.updateNotificationPreferences(
        userId,
        {
          viewNotifications: false,
          emailNotifications: false,
        }
      );

      expect(result.viewNotifications).toBe(false);
      expect(result.emailNotifications).toBe(false);
      expect(result.downloadNotifications).toBe(true);
    });

    it("should disable email notifications but keep recording analytics", async () => {
      const resumeId = "resume-1";
      const userId = "user-1";

      // User has disabled email notifications
      vi.mocked(prisma.resume.findUnique).mockResolvedValue({
        id: resumeId,
        userId,
      } as any);

      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue({
        userId,
        viewNotifications: true,
        downloadNotifications: true,
        emailNotifications: false, // Disabled
        aggregateViews: true,
      } as any);

      vi.mocked(prisma.resumeNotification.findFirst).mockResolvedValue(null);

      vi.mocked(prisma.resumeNotification.create).mockResolvedValue({
        id: "notif-1",
        userId,
        resumeId,
        type: "view",
        viewerEmail: "recruiter@company.com",
        aggregatedCount: 1,
        isRead: false,
        emailSent: false,
        createdAt: new Date(),
      } as any);

      await notificationService.createNotification(resumeId, "view", {
        viewerEmail: "recruiter@company.com",
      });

      // Notification should be created (analytics recorded)
      expect(prisma.resumeNotification.create).toHaveBeenCalled();

      // But email should not be sent
      expect(emailLib.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("Cleanup operations", () => {
    it("should delete old notifications", async () => {
      vi.mocked(prisma.resumeNotification.deleteMany).mockResolvedValue({
        count: 15,
      } as any);

      const deleted = await notificationService.deleteOldNotifications(30);

      expect(deleted).toBe(15);
      expect(prisma.resumeNotification.deleteMany).toHaveBeenCalled();
    });
  });
});
