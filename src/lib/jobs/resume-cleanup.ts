import { SharingService } from '@/features/resume/sharing-service';
import { VersioningService } from '@/features/resume/versioning-service';
import { NotificationService } from '@/features/resume/notification-service';

/**
 * Resume Completion Feature Cleanup Jobs
 * 
 * These jobs should be scheduled to run periodically:
 * - Expired share links cleanup: Daily
 * - Old versions archival: Weekly
 * - Old notifications cleanup: Daily
 * - Analytics aggregation: Daily
 */

/**
 * Clean up expired share links
 * Removes share links that have expired and been revoked
 */
export async function cleanupExpiredShareLinks(): Promise<number> {
  try {
    console.log('[Cleanup] Starting expired share links cleanup...');
    const deletedCount = await SharingService.deleteExpiredShareLinks();
    console.log(`[Cleanup] Deleted ${deletedCount} expired share links`);
    return deletedCount;
  } catch (error) {
    console.error('[Cleanup] Error cleaning up expired share links:', error);
    throw error;
  }
}

/**
 * Archive old resume versions
 * Keeps 50 most recent versions per resume
 * Runs for all resumes in the system
 */
export async function archiveOldVersions(): Promise<number> {
  try {
    console.log('[Cleanup] Starting version archival...');
    
    // Get all resumes
    const { prisma } = await import('@/lib/prisma');
    const resumes = await prisma.resume.findMany({
      select: { id: true },
    });

    let totalArchived = 0;

    // Archive versions for each resume
    for (const resume of resumes) {
      try {
        await VersioningService.archiveOldVersions(resume.id);
        totalArchived++;
      } catch (error) {
        console.error(`[Cleanup] Error archiving versions for resume ${resume.id}:`, error);
      }
    }

    console.log(`[Cleanup] Archived versions for ${totalArchived} resumes`);
    return totalArchived;
  } catch (error) {
    console.error('[Cleanup] Error archiving old versions:', error);
    throw error;
  }
}

/**
 * Delete old notifications
 * Removes read notifications older than 30 days
 */
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  try {
    console.log(`[Cleanup] Starting old notifications cleanup (${daysOld} days)...`);
    const deletedCount = await NotificationService.deleteOldNotifications(daysOld);
    console.log(`[Cleanup] Deleted ${deletedCount} old notifications`);
    return deletedCount;
  } catch (error) {
    console.error('[Cleanup] Error deleting old notifications:', error);
    throw error;
  }
}

/**
 * Run all cleanup jobs
 * Should be called once daily
 */
export async function runAllCleanupJobs(): Promise<{
  expiredShareLinks: number;
  archivedVersions: number;
  deletedNotifications: number;
}> {
  try {
    console.log('[Cleanup] Starting all cleanup jobs...');

    const [expiredShareLinks, archivedVersions, deletedNotifications] = await Promise.all([
      cleanupExpiredShareLinks(),
      archiveOldVersions(),
      deleteOldNotifications(),
    ]);

    console.log('[Cleanup] All cleanup jobs completed successfully');

    return {
      expiredShareLinks,
      archivedVersions,
      deletedNotifications,
    };
  } catch (error) {
    console.error('[Cleanup] Error running cleanup jobs:', error);
    throw error;
  }
}

/**
 * Schedule cleanup jobs
 * This should be called once at application startup
 */
export function scheduleCleanupJobs(): void {
  // Run cleanup jobs daily at 2 AM
  const scheduleTime = new Date();
  scheduleTime.setHours(2, 0, 0, 0);

  const now = new Date();
  let delay = scheduleTime.getTime() - now.getTime();

  if (delay < 0) {
    // If 2 AM has already passed today, schedule for tomorrow
    delay += 24 * 60 * 60 * 1000;
  }

  console.log(`[Cleanup] Scheduling cleanup jobs to run in ${Math.round(delay / 1000 / 60)} minutes`);

  setTimeout(() => {
    // Run immediately
    runAllCleanupJobs().catch(error => {
      console.error('[Cleanup] Error in scheduled cleanup:', error);
    });

    // Then run every 24 hours
    setInterval(() => {
      runAllCleanupJobs().catch(error => {
        console.error('[Cleanup] Error in scheduled cleanup:', error);
      });
    }, 24 * 60 * 60 * 1000);
  }, delay);
}
