import { env } from "@/lib/env";
import { siteConfig } from "@/config/site";

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";
const DEFAULT_FROM_EMAIL = "notifications@finbers-link.com";
const DEFAULT_FROM_NAME = siteConfig.name;

interface PasswordResetEmailInput {
  to: string;
  resetLink: string;
  userName?: string | null;
}

async function sendSendgridRequest(body: Record<string, unknown>) {
  if (!env.SENDGRID_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("SENDGRID_API_KEY not configured. Skipping transactional email send.");
      return;
    }
    throw new Error("Missing SENDGRID_API_KEY environment variable");
  }

  const response = await fetch(SENDGRID_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unable to read error body");
    throw new Error(`SendGrid request failed (${response.status}): ${errorText}`);
  }
}

export async function sendPasswordResetEmail({ to, resetLink, userName }: PasswordResetEmailInput) {
  const safeName = userName?.trim() || "there";
  const subject = `Reset your ${siteConfig.name} password`;
  const textContent = `Hi ${safeName},\n\nWe received a request to reset your ${siteConfig.name} password. If you made this request, click the link below to choose a new password. This link will expire soon.\n\n${resetLink}\n\nIf you didn't request a reset you can ignore this email.\n\n— ${siteConfig.name} Team`;
  const htmlContent = `
    <p>Hi ${safeName},</p>
    <p>We received a request to reset your ${siteConfig.name} password. Click the button below to choose a new password. This link will expire soon.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#0F172A;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:600;">
        Reset password
      </a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>If you didn't request a reset you can safely ignore this message.</p>
    <p>— ${siteConfig.name} Team</p>
  `;

  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
        subject,
      },
    ],
    from: {
      email: process.env.EMAIL_FROM_ADDRESS || DEFAULT_FROM_EMAIL,
      name: process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME,
    },
    content: [
      { type: "text/plain", value: textContent },
      { type: "text/html", value: htmlContent },
    ],
  };

  try {
    await sendSendgridRequest(payload);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to send password reset email", error);
    }
    throw error;
  }
}
