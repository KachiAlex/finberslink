import type { Role, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role?: Role;
  status?: UserStatus;
  tenantId?: string | null;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? "STUDENT",
      status: input.status ?? "ACTIVE",
      tenantId: input.tenantId ?? undefined,
    },
  });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function deletePasswordResetTokensForUser(userId: string) {
  return prisma.passwordResetToken.deleteMany({ where: { userId } });
}

export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
  return prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
}

export async function findPasswordResetToken(token: string) {
  return prisma.passwordResetToken.findUnique({ where: { token } });
}

export async function markPasswordResetTokenUsed(tokenId: string) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { consumedAt: new Date() },
  });
}
