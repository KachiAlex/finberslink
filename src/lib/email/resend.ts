import { env } from "@/lib/env";
import { siteConfig } from "@/config/site";

interface PasswordResetEmailInput {
  to: string;
  resetLink: string;
  userName?: string | null;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendPasswordResetEmailResend({ to, resetLink, userName }: PasswordResetEmailInput) {
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("RESEND_API_KEY not configured. Skipping transactional email send.");
      return;
    }
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  const safeName = userName?.trim() || "there";
  const subject = `Reset your ${siteConfig.name} password`;
  const html = `
    <p>Hi ${safeName},</p>
    <p>We received a request to reset your ${siteConfig.name} password. Click the button below to choose a new password. This link will expire soon.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#0F172A;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:600;">Reset password</a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>If you didn't request a reset you can safely ignore this message.</p>
    <p>— ${siteConfig.name} Team</p>
  `;

  const payload = {
    from: process.env.EMAIL_FROM_ADDRESS || `notifications@${new URL(siteConfig.baseUrl || "http://localhost:3000").hostname}`,
    to: [to],
    subject,
    html,
  };

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API request failed (${res.status}): ${text}`);
  }
}

export default sendPasswordResetEmailResend;
