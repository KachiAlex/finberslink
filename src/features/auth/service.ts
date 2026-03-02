import { createUser, findUserByEmail } from "@/features/auth/repository";
import type { LoginInput, RegisterInput } from "@/features/auth/schemas";
import { signAccessToken, signRefreshToken, verifyToken, type SessionPayload } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

type UserRole = 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT' | 'TUTOR' | 'EMPLOYER';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

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
