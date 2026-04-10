import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export interface NotificationMetadata {
  viewerEmail?: string;
  viewerName?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  country?: string;
  city?: string;
}

export interface NotificationPreferences {
  viewNotifications?: boolean;
  downloadNotifications?: boolean;
  emailNotifications?: boolean;
  aggregateViews?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  resumeId: string;
  type: "view" | "download";
  viewerEmail?: string;
  viewerName?: string;
  aggregatedCount: number;
  isRead: boolean;
  emailSent: boolean;
  createdAt: Date;
}

export class NotificationService {
  /**
   * Create a notification for a view or download event
   * Implements Property 18: Notification Creation on View
   */
  async createNotification(
    resumeId: string,
    type: "view" | "download",
    metadata: NotificationMetadata
  ): Promise<void> {
    try {
      // Get the resume to find the owner
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        select: { userId: true },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      // Get user's notification preferences
      const preferences = await this.getNotificationPreferences(resume.userId);

      // Check if notifications are enabled for this type
      const shouldNotify =
        type === "view"
          ? preferences.viewNotifications
          : preferences.downloadNotifications;

      if (!shouldNotify) {
        return;
      }

      // Check if we should aggregate with existing notifications
      if (preferences.aggregateViews && metadata.viewerEmail) {
        const existingNotification = await prisma.resumeNotification.findFirst({
          where: {
            userId: resume.userId,
            resumeId,
            type,
            viewerEmail: metadata.viewerEmail,
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
            },
          },
        });

        if (existingNotification) {
          // Update existing notification with aggregated count
          await prisma.resumeNotification.update({
            where: { id: existingNotification.id },
            data: {
              aggregatedCount: existingNotification.aggregatedCount + 1,
              createdAt: new Date(), // Update timestamp
            },
          });
          return;
        }
      }

      // Create new notification
      const notification = await prisma.resumeNotification.create({
        data: {
          userId: resume.userId,
          resumeId,
          type,
          viewerEmail: metadata.viewerEmail,
          viewerName: metadata.viewerName,
          aggregatedCount: 1,
          isRead: false,
          emailSent: false,
        },
      });

      // Send email notification if enabled
      if (preferences.emailNotifications) {
        await this.sendNotificationEmail(resume.userId, notification);
      }
    } catch (error) {
      console.error(
        `[NotificationService] Error creating notification for resume ${resumeId}:`,
        error
      );
      // Don't throw - notifications should not block main flow
    }
  }

  /**
   * Send email notification to user
   */
  async sendNotificationEmail(
    userId: string,
    notification: Notification
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user || !user.email) {
        throw new Error(`User not found or has no email: ${userId}`);
      }

      const resume = await prisma.resume.findUnique({
        where: { id: notification.resumeId },
        select: { title: true },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${notification.resumeId}`);
      }

      const eventType =
        notification.type === "view" ? "viewed" : "downloaded";
      const viewerInfo = notification.viewerName
        ? `${notification.viewerName} (${notification.viewerEmail})`
        : notification.viewerEmail || "Someone";

      const subject =
        notification.aggregatedCount > 1
          ? `${notification.aggregatedCount} people have ${eventType} your resume "${resume.title}"`
          : `Your resume "${resume.title}" was ${eventType}`;

      const analyticsLink = `${process.env.NEXT_PUBLIC_APP_URL}/resumes/${notification.resumeId}/analytics`;

      const htmlContent = `
        <h2>Resume Activity Notification</h2>
        <p>Hi ${user.name},</p>
        <p>${viewerInfo} has ${eventType} your resume <strong>"${resume.title}"</strong>.</p>
        ${
          notification.aggregatedCount > 1
            ? `<p>This is the ${notification.aggregatedCount}th view from this person in the last hour.</p>`
            : ""
        }
        <p>
          <a href="${analyticsLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Analytics
          </a>
        </p>
        <p>Best regards,<br>Finbers Link</p>
      `;

      await sendEmail({
        to: user.email,
        subject,
        html: htmlContent,
      });

      // Mark email as sent
      await prisma.resumeNotification.update({
        where: { id: notification.id },
        data: { emailSent: true },
      });
    } catch (error) {
      console.error(
        `[NotificationService] Error sending notification email for notification ${notification.id}:`,
        error
      );
      // Don't throw - email failures should not block
    }
  }

  /**
   * Get all notifications for a user with pagination
   */
  async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const [notifications, total] = await Promise.all([
        prisma.resumeNotification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.resumeNotification.count({
          where: { userId },
        }),
      ]);

      return { notifications, total };
    } catch (error) {
      console.error(
        `[NotificationService] Error fetching notifications for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await prisma.resumeNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      console.error(
        `[NotificationService] Error marking notification ${notificationId} as read:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await prisma.notificationPreference.create({
          data: {
            userId,
            viewNotifications: true,
            downloadNotifications: true,
            emailNotifications: true,
            aggregateViews: true,
          },
        });
      }

      return {
        viewNotifications: preferences.viewNotifications,
        downloadNotifications: preferences.downloadNotifications,
        emailNotifications: preferences.emailNotifications,
        aggregateViews: preferences.aggregateViews,
      };
    } catch (error) {
      console.error(
        `[NotificationService] Error fetching preferences for user ${userId}:`,
        error
      );
      // Return defaults on error
      return {
        viewNotifications: true,
        downloadNotifications: true,
        emailNotifications: true,
        aggregateViews: true,
      };
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    try {
      const updated = await prisma.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          viewNotifications: preferences.viewNotifications ?? true,
          downloadNotifications: preferences.downloadNotifications ?? true,
          emailNotifications: preferences.emailNotifications ?? true,
          aggregateViews: preferences.aggregateViews ?? true,
        },
        update: {
          viewNotifications:
            preferences.viewNotifications !== undefined
              ? preferences.viewNotifications
              : undefined,
          downloadNotifications:
            preferences.downloadNotifications !== undefined
              ? preferences.downloadNotifications
              : undefined,
          emailNotifications:
            preferences.emailNotifications !== undefined
              ? preferences.emailNotifications
              : undefined,
          aggregateViews:
            preferences.aggregateViews !== undefined
              ? preferences.aggregateViews
              : undefined,
        },
      });

      return {
        viewNotifications: updated.viewNotifications,
        downloadNotifications: updated.downloadNotifications,
        emailNotifications: updated.emailNotifications,
        aggregateViews: updated.aggregateViews,
      };
    } catch (error) {
      console.error(
        `[NotificationService] Error updating preferences for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.resumeNotification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error) {
      console.error(
        `[NotificationService] Error getting unread count for user ${userId}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.resumeNotification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } catch (error) {
      console.error(
        `[NotificationService] Error marking all notifications as read for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   * Keep notifications for 30 days
   */
  async deleteOldNotifications(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = await prisma.resumeNotification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error(
        `[NotificationService] Error deleting old notifications:`,
        error
      );
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
