import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { env } from '@/lib/env';
import { siteConfig } from '@/config/site';

export interface ShareLink {
  id: string;
  resumeId: string;
  shareToken: string;
  recipientEmail?: string;
  senderId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;
}

export interface ShareSummary {
  totalShares: number;
  activeLinks: number;
  expiredLinks: number;
}

/**
 * Sharing Service
 * Manages share links, expiration, and access control
 */
export class SharingService {
  /**
   * Generate cryptographically secure share token
   */
  static generateShareToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create share link(s) for a resume
   */
  static async createShareLink(
    resumeId: string,
    senderId: string,
    recipients: string[],
    expirationDays?: number,
    personalMessage?: string
  ): Promise<ShareLink[]> {
    try {
      // Validate resume exists and get sender info
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        include: { user: true },
      });

      if (!resume) {
        throw new Error(`Resume not found: ${resumeId}`);
      }

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
      });

      if (!sender) {
        throw new Error(`Sender not found: ${senderId}`);
      }

      // Default to 30 days if not specified
      const days = expirationDays || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      // Create share link for each recipient
      const shareLinks = await Promise.all(
        recipients.map(email =>
          prisma.resumeShareLink.create({
            data: {
              resumeId,
              senderId,
              recipientEmail: email,
              shareToken: this.generateShareToken(),
              expiresAt,
            },
          })
        )
      );

      // Send invitation emails asynchronously (non-blocking)
      Promise.all(
        shareLinks.map(link =>
          this.sendShareInvitationEmail(
            link.recipientEmail || '',
            link.shareToken,
            resume.title || 'Resume',
            sender.name || sender.email || 'A user',
            personalMessage
          ).catch(err => {
            console.error(`Failed to send email to ${link.recipientEmail}:`, err);
          })
        )
      ).catch(err => {
        console.error('Error sending share invitation emails:', err);
      });

      return shareLinks;
    } catch (error) {
      throw new Error(`Failed to create share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all share links for a resume
   */
  static async getShareLinks(resumeId: string): Promise<ShareLink[]> {
    try {
      const shareLinks = await prisma.resumeShareLink.findMany({
        where: { resumeId },
        orderBy: { createdAt: 'desc' },
      });

      return shareLinks;
    } catch (error) {
      throw new Error(`Failed to retrieve share links: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate share token (check expiration and revocation)
   */
  static async validateShareToken(shareToken: string): Promise<boolean> {
    try {
      const shareLink = await prisma.resumeShareLink.findUnique({
        where: { shareToken },
      });

      if (!shareLink) {
        return false;
      }

      // Check if revoked
      if (shareLink.revokedAt) {
        return false;
      }

      // Check if expired
      if (new Date() > shareLink.expiresAt) {
        return false;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to validate share token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get share link details
   */
  static async getShareLinkDetails(shareToken: string): Promise<ShareLink | null> {
    try {
      const shareLink = await prisma.resumeShareLink.findUnique({
        where: { shareToken },
      });

      return shareLink;
    } catch (error) {
      throw new Error(`Failed to retrieve share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extend share link expiration
   */
  static async extendExpiration(shareToken: string, additionalDays: number): Promise<Date> {
    try {
      const shareLink = await prisma.resumeShareLink.findUnique({
        where: { shareToken },
      });

      if (!shareLink) {
        throw new Error(`Share link not found: ${shareToken}`);
      }

      const newExpiresAt = new Date(shareLink.expiresAt);
      newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

      const updated = await prisma.resumeShareLink.update({
        where: { shareToken },
        data: { expiresAt: newExpiresAt },
      });

      return updated.expiresAt;
    } catch (error) {
      throw new Error(`Failed to extend expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revoke share link
   */
  static async revokeShareLink(shareToken: string): Promise<void> {
    try {
      await prisma.resumeShareLink.update({
        where: { shareToken },
        data: { revokedAt: new Date() },
      });
    } catch (error) {
      throw new Error(`Failed to revoke share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record view on share link
   */
  static async recordShareLinkView(shareToken: string): Promise<void> {
    try {
      await prisma.resumeShareLink.update({
        where: { shareToken },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to record view: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get share summary for a resume
   */
  static async getShareSummary(resumeId: string): Promise<ShareSummary> {
    try {
      const shareLinks = await prisma.resumeShareLink.findMany({
        where: { resumeId },
      });

      const now = new Date();
      const activeLinks = shareLinks.filter(
        link => !link.revokedAt && link.expiresAt > now
      ).length;
      const expiredLinks = shareLinks.filter(
        link => !link.revokedAt && link.expiresAt <= now
      ).length;

      return {
        totalShares: shareLinks.length,
        activeLinks,
        expiredLinks,
      };
    } catch (error) {
      throw new Error(`Failed to calculate share summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get remaining time until expiration
   */
  static getRemainingTime(expiresAt: Date): {
    days: number;
    hours: number;
    minutes: number;
    isExpired: boolean;
  } {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, isExpired: false };
  }

  /**
   * Delete expired share links (cleanup job)
   */
  static async deleteExpiredShareLinks(): Promise<number> {
    try {
      const result = await prisma.resumeShareLink.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          revokedAt: { not: null },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(`Failed to delete expired share links: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send share invitation email to recipient
   */
  static async sendShareInvitationEmail(
    recipientEmail: string,
    shareToken: string,
    resumeTitle: string,
    senderName: string,
    personalMessage?: string
  ): Promise<void> {
    try {
      const shareLink = `${siteConfig.baseUrl || 'http://localhost:3000'}/resumes/view/${shareToken}`;
      const subject = `${senderName} shared their resume "${resumeTitle}" with you`;

      const html = `
        <p>Hi there,</p>
        <p><strong>${senderName}</strong> has shared their resume with you.</p>
        ${personalMessage ? `<p><strong>Message from ${senderName}:</strong></p><p>${personalMessage}</p>` : ''}
        <p><strong>Resume:</strong> ${resumeTitle}</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${shareLink}" style="display:inline-block;padding:12px 20px;background:#0F172A;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:600;">View Resume</a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${shareLink}">${shareLink}</a></p>
        <p>This link will expire on ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}.</p>
        <p>— ${siteConfig.name} Team</p>
      `;

      await this.sendEmail({
        to: recipientEmail,
        subject,
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send share invitation email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send email using configured provider
   */
  private static async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const provider = (env.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || '').toLowerCase();

    if (provider === 'resend') {
      await this.sendViaResend(options);
    } else if (provider === 'sendgrid') {
      await this.sendViaSendGrid(options);
    } else if (env.SENDGRID_API_KEY) {
      await this.sendViaSendGrid(options);
    } else if (env.RESEND_API_KEY) {
      await this.sendViaResend(options);
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('No email provider configured. Skipping email send.');
      return;
    } else {
      throw new Error('No email provider configured');
    }
  }

  /**
   * Send email via Resend
   */
  private static async sendViaResend(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }

    const payload = {
      from: process.env.EMAIL_FROM_ADDRESS || `notifications@${new URL(siteConfig.baseUrl || 'http://localhost:3000').hostname}`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Resend API request failed (${res.status}): ${text}`);
    }
  }

  /**
   * Send email via SendGrid
   */
  private static async sendViaSendGrid(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const apiKey = env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('Missing SENDGRID_API_KEY environment variable');
    }

    const payload = {
      personalizations: [
        {
          to: [{ email: options.to }],
        },
      ],
      from: {
        email: process.env.EMAIL_FROM_ADDRESS || `notifications@${new URL(siteConfig.baseUrl || 'http://localhost:3000').hostname}`,
      },
      subject: options.subject,
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
      ],
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`SendGrid API request failed (${res.status}): ${text}`);
    }
  }
}
