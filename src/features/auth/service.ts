import "server-only";
import type { Role as PrismaRole, UserStatus as PrismaUserStatus } from "@prisma/client";

import {
  createPasswordResetToken,
  createUser,
  deletePasswordResetTokensForUser,
  findPasswordResetToken,
  findUserByEmail,
  markPasswordResetTokenUsed,
  updateUserPassword,
} from "@/features/auth/repository";
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "@/features/auth/schemas";
import { siteConfig } from "@/config/site";
import { signAccessToken, signRefreshToken, verifyToken, type SessionPayload } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/email/sendgrid";

type UserRole = PrismaRole;
type UserStatus = PrismaUserStatus;

const RESET_TOKEN_BYTE_LENGTH = 32;
const RESET_TOKEN_TTL_MINUTES = 60;

export async function registerUser(input: RegisterInput, tenantId?: string | null) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash,
    role: (input.role ?? 'STUDENT') as UserRole,
    tenantId,
  });

  return buildTokens(user.id, user.role, user.status, user.tenantId ?? null);
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  return buildTokens(user.id, user.role, user.status, user.tenantId ?? null);
}

export function refreshSession(refreshToken: string) {
  const payload = verifyToken(refreshToken);
  return buildTokens(payload.sub, payload.role, payload.status, payload.tenantId ?? null, refreshToken);
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  // For security we return success even if the user does not exist
  if (!user) {
    return;
  }

  await deletePasswordResetTokensForUser(user.id);
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  await createPasswordResetToken(user.id, token, expiresAt);

  const resetLink = buildResetLink(token);
  await sendPasswordResetEmail({
    to: normalizedEmail,
    resetLink,
    userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.firstName || null,
  });
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenRecord = await findPasswordResetToken(input.token);
  if (!tokenRecord || tokenRecord.consumedAt || tokenRecord.expiresAt < new Date()) {
    throw new Error("Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(input.password);
  await updateUserPassword(tokenRecord.userId, passwordHash);
  await markPasswordResetTokenUsed(tokenRecord.id);
  await deletePasswordResetTokensForUser(tokenRecord.userId);
}

function getAppBaseUrl() {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || siteConfig.baseUrl || "http://localhost:3000";
}

function buildResetLink(token: string) {
  const baseUrl = getAppBaseUrl().replace(/\/$/, "");
  return `${baseUrl}/reset-password?token=${token}`;
}

function buildTokens(
  userId: string,
  role: UserRole,
  status: UserStatus,
  tenantId: string | null,
  refreshToken?: string
) {
  const sessionPayload: SessionPayload = {
    sub: userId,
    role,
    status,
    tenantId,
  };

  const newRefreshToken = refreshToken ?? signRefreshToken(sessionPayload);

  return {
    accessToken: signAccessToken(sessionPayload),
    refreshToken: newRefreshToken,
  };
}

function generateResetToken() {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error("Secure random generator not available");
  }

  const bytes = cryptoObj.getRandomValues(new Uint8Array(RESET_TOKEN_BYTE_LENGTH));
  let token = "";
  for (let i = 0; i < bytes.length; i += 1) {
    token += bytes[i].toString(16).padStart(2, "0");
  }
  return token;
}
