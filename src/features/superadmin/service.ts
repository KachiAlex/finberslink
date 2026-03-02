import { prisma } from "@/lib/prisma";

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
const DEFAULT_SUPER_ADMIN_ID =
  process.env.NEXT_PUBLIC_DEMO_SUPERADMIN_ID ?? "user_super_admin";

export async function requireSuperAdminUser(userId?: string) {
  const superAdmin = await prisma.user.findUnique({
    where: { id: userId ?? DEFAULT_SUPER_ADMIN_ID },
  });

  if (!superAdmin || superAdmin.role !== SUPER_ADMIN_ROLE) {
    throw new Error("Not authorized");
  }

  return superAdmin;
}
