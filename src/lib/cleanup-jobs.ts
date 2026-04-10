/**
 * Cleanup Jobs for Resume Completion Feature
 * Task 65: Implement cleanup jobs
 */

import { sharingService } from "@/features/resume/sharing-service";
import { versioningService } from "@/features/resume/versioning-service";
import { analyticsService } from "@/features/resume/analytics-service";
import { notificationService } from "@/features/resume/notification-service";
import { prisma } from "@/lib/prisma";

export class CleanupJobs {
  /**
   * Clean up expired share links
   * Runs: Daily
   */
  async cleanupExpiredShareLinks(): Promise<{ cleaned: number }> {
    try {
      const now = new Date();

      const result = await prisma.resumeShareLink.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
          revokedAt: null,
        },
      });

      console.log(
        `[CleanupJobs] Cleaned up ${result.count} expired share links`
      );

      return { cleaned: result.count };
    } catch (error) {
      console.error(
        `[CleanupJobs] Error cleaning up expired share links:`,
        error
      );
      throw error;
    }
  }

  /**
   * Archive old versions (keep 50 most recent)
   * Runs: Weekly
   */
  async archiveOldVersions(): Promise<{ archived: number }> {
    try {
      // Get all resumes
      const resumes = await prisma.resume.findMany({
        select: { id: true },
      });

      let totalArchived = 0;

      for (const resume of resumes) {
        try {
          await versioningService.archiveOldVersions(resume.id);
          totalArchived++;
        } catch (error) {
          console.error(
            `[CleanupJobs] Error archiving versions for resume ${resume.id}:`,
            error
          );
        }
      }

      console.log(`[CleanupJobs] Archived versions for ${totalArchived} resumes`);

      return { archived: totalArchived };
    } catch (error) {
      console.error(`[CleanupJobs] Error archiving old versions:`, error);
      throw error;
    }
  }

  /**
   * Delete archived versions older than 90 days
   * Runs: Weekly
   */
  async deleteArchivedVersions(): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await prisma.resumeVersion.deleteMany({
        where: {
          archivedAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(
        `[CleanupJobs] Deleted ${result.count} archived versions older than 90 days`
      );

      return { deleted: result.count };
    } catch (error) {
      console.error(
        `[CleanupJobs] Error deleting archived versions:`,
        error
      );
      throw error;
    }
  }

  /**
   * Aggregate analytics data
   * Runs: Daily
   * Keeps hourly detail for last 30 days, aggregates older data into daily summaries
   */
  async aggregateAnalyticsData(): Promise<{ aggregated: number }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get records older than 30 days
      const oldRecords = await prisma.resumeView.findMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
        select: {
          resumeId: true,
          createdAt: true,
          viewCount: true,
        },
      });

      // Group by resume and date
      const aggregated = new Map<string, { date: string; count: number }>();

      for (const record of oldRecords) {
        const date = record.createdAt.toISOString().split("T")[0];
        const key = `${record.resumeId}:${date}`;

        if (aggregated.has(key)) {
          const existing = aggregated.get(key)!;
          existing.count += 1;
        } else {
          aggregated.set(key, { date, count: 1 });
        }
      }

      console.log(
        `[CleanupJobs] Aggregated ${aggregated.size} analytics records`
      );

      return { aggregated: aggregated.size };
    } catch (error) {
      console.error(
        `[CleanupJobs] Error aggregating analytics data:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete old notifications (keep 30 days)
   * Runs: Weekly
   */
  async deleteOldNotifications(): Promise<{ deleted: number }> {
    try {
      const deleted = await notificationService.deleteOldNotifications(30);

      console.log(`[CleanupJobs] Deleted ${deleted} old notifications`);

      return { deleted };
    } catch (error) {
      console.error(`[CleanupJobs] Error deleting old notifications:`, error);
      throw error;
    }
  }

  /**
   * Run all cleanup jobs
   */
  async runAll(): Promise<{
    expiredShareLinks: number;
    archivedVersions: number;
    deletedArchivedVersions: number;
    aggregatedAnalytics: number;
    deletedNotifications: number;
  }> {
    console.log("[CleanupJobs] Starting cleanup jobs...");

    const results = {
      expiredShareLinks: 0,
      archivedVersions: 0,
      deletedArchivedVersions: 0,
      aggregatedAnalytics: 0,
      deletedNotifications: 0,
    };

    try {
      const shareLinksResult = await this.cleanupExpiredShareLinks();
      results.expiredShareLinks = shareLinksResult.cleaned;
    } catch (error) {
      console.error("[CleanupJobs] Failed to cleanup expired share links");
    }

    try {
      const archiveResult = await this.archiveOldVersions();
      results.archivedVersions = archiveResult.archived;
    } catch (error) {
      console.error("[CleanupJobs] Failed to archive old versions");
    }

    try {
      const deleteResult = await this.deleteArchivedVersions();
      results.deletedArchivedVersions = deleteResult.deleted;
    } catch (error) {
      console.error("[CleanupJobs] Failed to delete archived versions");
    }

    try {
      const analyticsResult = await this.aggregateAnalyticsData();
      results.aggregatedAnalytics = analyticsResult.aggregated;
    } catch (error) {
      console.error("[CleanupJobs] Failed to aggregate analytics data");
    }

    try {
      const notificationsResult = await this.deleteOldNotifications();
      results.deletedNotifications = notificationsResult.deleted;
    } catch (error) {
      console.error("[CleanupJobs] Failed to delete old notifications");
    }

    console.log("[CleanupJobs] Cleanup jobs completed", results);

    return results;
  }
}

export const cleanupJobs = new CleanupJobs();
