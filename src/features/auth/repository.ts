import { Role, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role?: Role;
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
      role: input.role ?? Role.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });
}
