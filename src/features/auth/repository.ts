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
