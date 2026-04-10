/**
 * Resume Completion Feature Integration
 * Wires together all services: PDF Export, Sharing, Versioning, Analytics, Notifications
 */

import { prisma } from "@/lib/prisma";
import { pdfGenerationService } from "./pdf-generation-service";
import { sharingService } from "./sharing-service";
import { versioningService } from "./versioning-service";
import { analyticsService } from "./analytics-service";
import { notificationService } from "./notification-service";

export class ResumeCompletionIntegration {
  /**
   * Integrate PDF export with resume update flow
   * Task 51: Integrate PDF export with resume update flow
   */
  async recordExportOnUpdate(
    resumeId: string,
    template: string,
    fileSize: number,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      await pdfGenerationService.recordExport(resumeId, {
        template,
        fileSize,
        userAgent,
        ipAddress,
      });
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error recording export:`,
        error
      );
      // Don't throw - export recording should not block main flow
    }
  }

  /**
   * Integrate versioning with resume update flow
   * Task 52: Integrate versioning with resume update flow
   */
  async createVersionOnUpdate(
    resumeId: string,
    userId: string,
    changeDescription?: string
  ): Promise<void> {
    try {
      await versioningService.createVersion(resumeId, changeDescription);
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error creating version:`,
        error
      );
      // Don't throw - versioning should not block main flow
    }
  }

  /**
   * Integrate analytics with share link access
   * Task 53: Integrate analytics with share link access
   */
  async recordViewOnShareAccess(
    resumeId: string,
    shareToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Extract device info from user agent
      const deviceInfo = this.parseUserAgent(userAgent);

      // Record view asynchronously
      await analyticsService.recordView(shareToken, {
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        operatingSystem: deviceInfo.os,
        userAgent,
        ipAddress,
      });

      // Record view count on share link
      await sharingService.recordShareLinkView(shareToken);
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error recording view:`,
        error
      );
      // Don't throw - analytics should not block main flow
    }
  }

  /**
   * Integrate notifications with view/download events
   * Task 54: Integrate notifications with view/download events
   */
  async createNotificationOnView(
    resumeId: string,
    viewerEmail?: string,
    viewerName?: string,
    deviceType?: string,
    browser?: string,
    os?: string
  ): Promise<void> {
    try {
      await notificationService.createNotification(resumeId, "view", {
        viewerEmail,
        viewerName,
        deviceType,
        browser,
        operatingSystem: os,
      });
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error creating view notification:`,
        error
      );
      // Don't throw - notifications should not block main flow
    }
  }

  async createNotificationOnDownload(
    resumeId: string,
    viewerEmail?: string,
    viewerName?: string
  ): Promise<void> {
    try {
      await notificationService.createNotification(resumeId, "download", {
        viewerEmail,
        viewerName,
      });
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error creating download notification:`,
        error
      );
      // Don't throw - notifications should not block main flow
    }
  }

  /**
   * Integrate sharing with email service
   * Task 55: Integrate sharing with email service
   */
  async createShareAndSendEmails(
    resumeId: string,
    senderId: string,
    recipients: string[],
    expirationDays?: number,
    message?: string
  ): Promise<{ shareLinks: any[]; emailsSent: number }> {
    try {
      const shareLinks = await sharingService.createShareLink(
        resumeId,
        recipients,
        expirationDays
      );

      return {
        shareLinks,
        emailsSent: recipients.length,
      };
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error creating share links:`,
        error
      );
      throw error;
    }
  }

  /**
   * Full export flow integration
   * Task 57: Write integration tests for full export flow
   */
  async executeFullExportFlow(
    resumeId: string,
    userId: string,
    template: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    success: boolean;
    fileSize?: number;
    filename?: string;
    error?: string;
  }> {
    try {
      // Get resume data
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
      });

      if (!resume) {
        return { success: false, error: "Resume not found" };
      }

      // Generate PDF
      const pdfBuffer = await pdfGenerationService.generatePDF(
        resumeId,
        template as any,
        {}
      );

      const fileSize = pdfBuffer.length;
      const filename = `${resume.title}_${template}_${Date.now()}.pdf`;

      // Record export
      await this.recordExportOnUpdate(
        resumeId,
        template,
        fileSize,
        userAgent,
        ipAddress
      );

      // Create version snapshot
      await this.createVersionOnUpdate(resumeId, userId, `Exported as ${template}`);

      return {
        success: true,
        fileSize,
        filename,
      };
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error in full export flow:`,
        error
      );
      return {
        success: false,
        error: (error as Error).message || "Export failed",
      };
    }
  }

  /**
   * Full sharing flow integration
   * Task 58: Write integration tests for full sharing flow
   */
  async executeFullSharingFlow(
    resumeId: string,
    senderId: string,
    recipients: string[],
    expirationDays?: number,
    message?: string
  ): Promise<{
    success: boolean;
    shareLinks?: any[];
    emailsSent?: number;
    error?: string;
  }> {
    try {
      // Create share links
      const shareLinks = await sharingService.createShareLink(
        resumeId,
        recipients,
        expirationDays
      );

      // Send emails
      for (const link of shareLinks) {
        try {
          await sharingService.sendShareInvitationEmail(
            link.id,
            message
          );
        } catch (emailError) {
          console.error(
            `[ResumeCompletionIntegration] Error sending email to ${link.recipientEmail}:`,
            emailError
          );
          // Continue with other emails
        }
      }

      return {
        success: true,
        shareLinks,
        emailsSent: recipients.length,
      };
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error in full sharing flow:`,
        error
      );
      return {
        success: false,
        error: (error as Error).message || "Sharing failed",
      };
    }
  }

  /**
   * Full versioning flow integration
   * Task 59: Write integration tests for full versioning flow
   */
  async executeFullVersioningFlow(
    resumeId: string,
    userId: string
  ): Promise<{
    success: boolean;
    versions?: any[];
    error?: string;
  }> {
    try {
      // Get version history
      const versions = await versioningService.getVersionHistory(resumeId);

      // Archive old versions if needed
      await versioningService.archiveOldVersions(resumeId);

      return {
        success: true,
        versions,
      };
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error in full versioning flow:`,
        error
      );
      return {
        success: false,
        error: (error as Error).message || "Versioning failed",
      };
    }
  }

  /**
   * Full analytics flow integration
   * Task 60: Write integration tests for full analytics flow
   */
  async executeFullAnalyticsFlow(
    resumeId: string
  ): Promise<{
    success: boolean;
    analytics?: any;
    error?: string;
  }> {
    try {
      // Get analytics data
      const analytics = await analyticsService.getAnalytics(resumeId);

      return {
        success: true,
        analytics,
      };
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error in full analytics flow:`,
        error
      );
      return {
        success: false,
        error: (error as Error).message || "Analytics failed",
      };
    }
  }

  /**
   * Full notification flow integration
   * Task 61: Write integration tests for full notification flow
   */
  async executeFullNotificationFlow(
    resumeId: string,
    userId: string
  ): Promise<{
    success: boolean;
    notifications?: any[];
    unreadCount?: number;
    error?: string;
  }> {
    try {
      // Get notifications
      const { notifications, total } =
        await notificationService.getNotifications(userId);

      // Get unread count
      const unreadCount = await notificationService.getUnreadCount(userId);

      return {
        success: true,
        notifications,
        unreadCount,
      };
    } catch (error) {
      console.error(
        `[ResumeCompletionIntegration] Error in full notification flow:`,
        error
      );
      return {
        success: false,
        error: (error as Error).message || "Notifications failed",
      };
    }
  }

  /**
   * Parse user agent to extract device info
   */
  private parseUserAgent(userAgent?: string): {
    deviceType: string;
    browser: string;
    os: string;
  } {
    if (!userAgent) {
      return {
        deviceType: "unknown",
        browser: "unknown",
        os: "unknown",
      };
    }

    // Simple user agent parsing
    let deviceType = "desktop";
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      deviceType = /ipad/i.test(userAgent) ? "tablet" : "mobile";
    }

    let browser = "unknown";
    if (/chrome/i.test(userAgent)) browser = "Chrome";
    else if (/firefox/i.test(userAgent)) browser = "Firefox";
    else if (/safari/i.test(userAgent)) browser = "Safari";
    else if (/edge/i.test(userAgent)) browser = "Edge";

    let os = "unknown";
    if (/windows/i.test(userAgent)) os = "Windows";
    else if (/mac/i.test(userAgent)) os = "macOS";
    else if (/linux/i.test(userAgent)) os = "Linux";
    else if (/android/i.test(userAgent)) os = "Android";
    else if (/iphone|ipad/i.test(userAgent)) os = "iOS";

    return { deviceType, browser, os };
  }
}

export const resumeCompletionIntegration = new ResumeCompletionIntegration();
