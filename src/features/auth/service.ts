import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, SessionPayload } from "@/lib/auth/jwt";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;
const LOCKOUT_DURATION_MINUTES = 30;

// ─── Rate Limiting Helpers ────────────────────────────────────────────────────

export async function isAccountLocked(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email }, select: { lockedUntil: true } });
  if (!user?.lockedUntil) return false;
  return user.lockedUntil > new Date();
}

export async function recordFailedLogin(email: string): Promise<void> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, failedLoginCount: true, lastFailedLoginAt: true },
  });

  if (!user) return;

  // Reset count if last failure was outside the window
  const countInWindow =
    user.lastFailedLoginAt && user.lastFailedLoginAt > windowStart
      ? user.failedLoginCount + 1
      : 1;

  const shouldLock = countInWindow >= MAX_FAILED_ATTEMPTS;

  await prisma.user.update({
    where: { email },
    data: {
      failedLoginCount: countInWindow,
      lastFailedLoginAt: new Date(),
      ...(shouldLock && { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000) }),
    },
  });

  await prisma.loginAttempt.create({
    data: { email, success: false },
  });
}

export async function clearFailedLogins(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: { failedLoginCount: 0, lastFailedLoginAt: null, lockedUntil: null },
  });
}

export async function lockAccount(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000) },
  });
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export async function loginUser(data: { email: string; password: string }) {
  const { email, password } = data;

  // Always look up user but use generic error to prevent enumeration
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Still record attempt to prevent timing attacks revealing email existence
    await prisma.loginAttempt.create({ data: { email, success: false } }).catch(() => {});
    throw new Error("Invalid credentials");
  }

  // Check account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    await recordFailedLogin(email);
    throw new Error("Invalid credentials");
  }

  // Success - clear failed login tracking
  await clearFailedLogins(email);
  await prisma.loginAttempt.create({ data: { email, success: true } }).catch(() => {});

  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? undefined,
  };

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(user.id),
  ]);

  return { accessToken, refreshToken, user };
}

export async function registerUser(
  data: { firstName: string; lastName: string; email: string; password: string; role: "STUDENT" | "TUTOR" },
  tenantId?: string
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("User already exists");

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      passwordHash,
      ...(tenantId && { tenantId }),
    },
  });

  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? undefined,
  };

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(user.id),
  ]);

  return { accessToken, refreshToken, user };
}

export async function refreshSession(refreshToken: string) {
  const decoded = await verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) throw new Error("User not found");

  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? undefined,
  };

  const [newAccessToken, newRefreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(user.id),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const resetToken = Math.random().toString(36).substring(2, 15);
  return { email, resetToken };
}

export async function resetPassword(token: string, newPassword: string) {
  return true;
}
