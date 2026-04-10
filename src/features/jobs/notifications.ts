import { prisma } from "../../lib/prisma";

export interface JobNotification {
  id: string;
  userId: string;
  type: 'APPLICATION_STATUS' | 'NEW_MATCHING_JOB' | 'JOB_ALERT' | 'APPLICATION_REVIEW' | 'INTERVIEW_SCHEDULED';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  applicationUpdates: boolean;
  newJobMatches: boolean;
  jobAlerts: boolean;
  marketingEmails: boolean;
}

// Create job notification
export async function createJobNotification(
  userId: string,
  type: JobNotification['type'],
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<JobNotification> {
  try {
    const notification = await prisma.jobNotification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
        isRead: false
      }
    });

    return notification as JobNotification;
  } catch (error) {
    console.error('Error creating job notification:', error);
    throw error;
  }
}

// Get user notifications
export async function getUserNotifications(
  userId: string,
  limit = 20,
  offset = 0
): Promise<JobNotification[]> {
  try {
    const notifications = await prisma.jobNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return notifications as JobNotification[];
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await prisma.jobNotification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark all notifications as read for user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    await prisma.jobNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const count = await prisma.jobNotification.count({
      where: { userId, isRead: false }
    });
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

// Delete notification
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await prisma.jobNotification.delete({
      where: { id: notificationId }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

// Notification triggers for different events

export async function triggerApplicationStatusNotification(
  userId: string,
  applicationId: string,
  newStatus: string,
  jobTitle: string,
  companyName: string
): Promise<void> {
  const statusMessages: Record<string, { title: string; message: string }> = {
    'IN_REVIEW': {
      title: 'Application Under Review',
      message: `Your application for ${jobTitle} at ${companyName} is now under review.`
    },
    'INTERVIEW': {
      title: 'Interview Requested',
      message: `Congratulations! ${companyName} has requested an interview for ${jobTitle}.`
    },
    'OFFERED': {
      title: 'Job Offer Received!',
      message: `Exciting news! You've received a job offer for ${jobTitle} at ${companyName}.`
    },
    'REJECTED': {
      title: 'Application Update',
      message: `Your application for ${jobTitle} at ${companyName} was not selected at this time.`
    }
  };

  const statusMessage = statusMessages[newStatus];
  if (statusMessage) {
    await createJobNotification(
      userId,
      'APPLICATION_STATUS',
      statusMessage.title,
      statusMessage.message,
      {
        applicationId,
        jobTitle,
        companyName,
        status: newStatus
      }
    );
  }
}

export async function triggerNewMatchingJobsNotification(
  userId: string,
  matchingJobs: Array<{
    id: string;
    title: string;
    company: string;
    matchScore: number;
  }>
): Promise<void> {
  if (matchingJobs.length === 0) return;

  const topJobs = matchingJobs.slice(0, 3);
  const jobList = topJobs.map(job => `${job.title} at ${job.company}`).join(', ');

  await createJobNotification(
    userId,
    'NEW_MATCHING_JOB',
    'New Job Matches Available',
    `We found ${matchingJobs.length} new jobs that match your profile. Top matches: ${jobList}`,
    {
      matchingJobs: topJobs,
      totalMatches: matchingJobs.length
    }
  );
}

export async function triggerJobAlertNotification(
  userId: string,
  matchingJobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
  }>
): Promise<void> {
  if (matchingJobs.length === 0) return;

  const jobList = matchingJobs.slice(0, 3).map(job => `${job.title} at ${job.company}`).join(', ');

  await createJobNotification(
    userId,
    'JOB_ALERT',
    'New Jobs Matching Your Alert',
    `${matchingJobs.length} new jobs match your alert criteria. Latest: ${jobList}`,
    {
      matchingJobs,
      alertType: 'job_alert'
    }
  );
}

export async function triggerApplicationReviewNotification(
  employerId: string,
  applicationCount: number,
  jobTitle: string
): Promise<void> {
  await createJobNotification(
    employerId,
    'APPLICATION_REVIEW',
    'New Applications to Review',
    `You have ${applicationCount} new application${applicationCount > 1 ? 's' : ''} to review for ${jobTitle}.`,
    {
      applicationCount,
      jobTitle
    }
  );
}

export async function triggerInterviewScheduledNotification(
  userId: string,
  jobTitle: string,
  companyName: string,
  interviewDate: Date,
  interviewType: string
): Promise<void> {
  const formattedDate = interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  await createJobNotification(
    userId,
    'INTERVIEW_SCHEDULED',
    'Interview Scheduled',
    `Your interview for ${jobTitle} at ${companyName} is scheduled for ${formattedDate}.`,
    {
      jobTitle,
      companyName,
      interviewDate: interviewDate.toISOString(),
      interviewType
    }
  );
}

// Get user notification preferences
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!preferences) {
      // Create default preferences
      const defaultPrefs = await prisma.notificationPreference.create({
        data: {
          userId,
          emailNotifications: true,
          pushNotifications: true,
          applicationUpdates: true,
          newJobMatches: true,
          jobAlerts: true,
          marketingEmails: false
        }
      });

      return {
        userId: defaultPrefs.userId,
        emailNotifications: defaultPrefs.emailNotifications,
        pushNotifications: defaultPrefs.pushNotifications,
        applicationUpdates: defaultPrefs.applicationUpdates,
        newJobMatches: defaultPrefs.newJobMatches,
        jobAlerts: defaultPrefs.jobAlerts,
        marketingEmails: defaultPrefs.marketingEmails
      };
    }

    return {
      userId: preferences.userId,
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      applicationUpdates: preferences.applicationUpdates,
      newJobMatches: preferences.newJobMatches,
      jobAlerts: preferences.jobAlerts,
      marketingEmails: preferences.marketingEmails
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

// Update user notification preferences
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    await prisma.notificationPreference.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        emailNotifications: preferences.emailNotifications ?? true,
        pushNotifications: preferences.pushNotifications ?? true,
        applicationUpdates: preferences.applicationUpdates ?? true,
        newJobMatches: preferences.newJobMatches ?? true,
        jobAlerts: preferences.jobAlerts ?? true,
        marketingEmails: preferences.marketingEmails ?? false
      }
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
  }
}

// Check if user should receive notification based on preferences
export async function shouldSendNotification(
  userId: string,
  notificationType: JobNotification['type']
): Promise<boolean> {
  const preferences = await getUserNotificationPreferences(userId);
  if (!preferences) return true; // Default to sending if no preferences set

  switch (notificationType) {
    case 'APPLICATION_STATUS':
    case 'APPLICATION_REVIEW':
    case 'INTERVIEW_SCHEDULED':
      return preferences.applicationUpdates;
    case 'NEW_MATCHING_JOB':
      return preferences.newJobMatches;
    case 'JOB_ALERT':
      return preferences.jobAlerts;
    default:
      return true;
  }
}

// Clean up old notifications (older than 30 days)
export async function cleanupOldNotifications(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await prisma.jobNotification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isRead: true // Only delete read notifications
      }
    });

    return result.count;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    return 0;
  }
}

// Get notification statistics
export async function getNotificationStatistics(userId: string): Promise<{
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Record<string, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}> {
  try {
    const [total, unread, byType] = await Promise.all([
      prisma.jobNotification.count({ where: { userId } }),
      prisma.jobNotification.count({ where: { userId, isRead: false } }),
      prisma.jobNotification.groupBy({
        by: ['type'],
        where: { userId },
        _count: true
      })
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM "JobNotification"
      WHERE user_id = ${userId}
        AND created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return {
      totalNotifications: total,
      unreadNotifications: unread,
      notificationsByType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentActivity
    };
  } catch (error) {
    console.error('Error getting notification statistics:', error);
    return {
      totalNotifications: 0,
      unreadNotifications: 0,
      notificationsByType: {},
      recentActivity: []
    };
  }
}
