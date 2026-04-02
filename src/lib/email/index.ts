import { env } from "@/lib/env";
import { sendPasswordResetEmail as sendGridPasswordReset } from "./sendgrid";
import sendPasswordResetEmailResend from "./resend";

interface PasswordResetEmailInput {
  to: string;
  resetLink: string;
  userName?: string | null;
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const provider = (env.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || "").toLowerCase();

  if (provider === "resend") return sendPasswordResetEmailResend(input);
  if (provider === "sendgrid") return sendGridPasswordReset(input);

  // Auto-select based on available keys: prefer SendGrid if configured, otherwise Resend
  if (env.SENDGRID_API_KEY) return sendGridPasswordReset(input);
  if (env.RESEND_API_KEY) return sendPasswordResetEmailResend(input);

  // No provider configured — non-production warn and return
  if (process.env.NODE_ENV !== "production") {
    console.warn("No email provider configured (SENDGRID_API_KEY or RESEND_API_KEY). Skipping send.");
    return;
  }

  throw new Error("No email provider configured");
}

export default sendPasswordResetEmail;
