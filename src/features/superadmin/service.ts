import { prisma } from "@/lib/prisma";

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export async function requireSuperAdminUser(userId: string) {
  if (!userId) {
    throw new Error("Not authorized");
  }

  const superAdmin = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!superAdmin || superAdmin.role !== SUPER_ADMIN_ROLE) {
    throw new Error("Not authorized");
  }

  return superAdmin;
}
