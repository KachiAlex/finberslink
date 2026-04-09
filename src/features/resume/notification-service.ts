import { prisma } from '@/lib/prisma';

export interface NotificationMetadata {
  viewerEmail?: string;
  viewerName?: string;
  type: 'view' | 'download';
}

export interface Notification {
  id: string;
  userId: string;
  resumeId: string;
  type: string;
  viewerEmail?: string;
  viewerName?: string;
  aggregatedCount: number;
  isRead: boolean;
  emailSent: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  viewNotifications: boolean;
  downloadNotifications: boolean;
  emailNotifications: boolean;
  aggregateViews: boolean;
}

/**
 * Notification Service
 * Sends notifications for resume activity
 */
export class NotificationService {
  private static readonly AGGREGATION_WINDOW_MINUTES = 60;

  /**
   * Create notification for view/download
   */
  static async createNotification(
    resumeId: string,
    metadata: NotificationMetadata
  ): Promise<void> {
    try {
      // Get resume to find owner
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        select: { userId: true },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      // Get user preferences
      const preferences = await this.getNotificationPreferences(resume.userId);

      // Check if notifications are enabled for this type
      if (metadata.type === 'view' && !preferences.viewNotifications) {
        return;
      }
      if (metadata.type === 'download' && !preferences.downloadNotifications) {
        return;
      }

      // Check if we should aggregate
      if (preferences.aggregateViews && metadata.type === 'view') {
        await this.createOrAggregateNotification(
          resume.userId,
          resumeId,
          metadata
        );
      } else {
        await prisma.resumeNotification.create({
          data: {
            userId: resume.userId,
            resumeId,
            type: metadata.type,
            viewerEmail: metadata.viewerEmail,
            viewerName: metadata.viewerName,
          },
        });
      }

      // Send email if enabled
      if (preferences.emailNotifications) {
        await this.sendNotificationEmail(resume.userId, resumeId, metadata);
      }
    } catch (error) {
      throw new Error(`Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create or aggregate notification
   */
  private static async createOrAggregateNotification(
    userId: string,
    resumeId: string,
    metadata: NotificationMetadata
  ): Promise<void> {
    try {
      // Look for recent notification from same viewer
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - this.AGGREGATION_WINDOW_MINUTES);

      const existingNotification = await prisma.resumeNotification.findFirst({
        where: {
          userId,
          resumeId,
          type: metadata.type,
          viewerEmail: metadata.viewerEmail,
          createdAt: { gte: cutoffTime },
        },
      });

      if (existingNotification) {
        // Aggregate with existing notification
        await prisma.resumeNotification.update({
          where: { id: existingNotification.id },
          data: {
            aggregatedCount: { increment: 1 },
          },
        });
      } else {
        // Create new notification
        await prisma.resumeNotification.create({
          data: {
            userId,
            resumeId,
            type: metadata.type,
            viewerEmail: metadata.viewerEmail,
            viewerName: metadata.viewerName,
          },
        });
      }
    } catch (error) {
      throw new Error(`Failed to create or aggregate notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get notifications for user
   */
  static async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    try {
      const notifications = await prisma.resumeNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const unreadCount = await prisma.resumeNotification.count({
        where: { userId, isRead: false },
      });

      return { notifications, unreadCount };
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await prisma.resumeNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.resumeNotification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // Create default preferences if not found
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
      throw new Error(`Failed to get notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const updated = await prisma.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...preferences,
        },
        update: preferences,
      });

      return {
        viewNotifications: updated.viewNotifications,
        downloadNotifications: updated.downloadNotifications,
        emailNotifications: updated.emailNotifications,
        aggregateViews: updated.aggregateViews,
      };
    } catch (error) {
      throw new Error(`Failed to update notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send notification email
   */
  private static async sendNotificationEmail(
    userId: string,
    resumeId: string,
    metadata: NotificationMetadata
  ): Promise<void> {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get resume title
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        select: { title: true },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      // TODO: Implement email sending
      // This would integrate with an email service like SendGrid, Mailgun, etc.
      // For now, this is a placeholder

      console.log(`Email notification sent to ${user.email} for ${metadata.type} on resume "${resume.title}"`);

      // Mark email as sent
      const notification = await prisma.resumeNotification.findFirst({
        where: {
          userId,
          resumeId,
          type: metadata.type,
          viewerEmail: metadata.viewerEmail,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (notification) {
        await prisma.resumeNotification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        });
      }
    } catch (error) {
      console.error('Failed to send notification email:', error);
      // Don't throw - email sending failure shouldn't block notification creation
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.resumeNotification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true,
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(`Failed to delete old notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.resumeNotification.count({
        where: { userId, isRead: false },
      });

      return count;
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
