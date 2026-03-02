import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const DEFAULT_TENANT_SLUG = env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "finbers-link";

export async function getOrCreateDefaultTenant() {
  return prisma.tenant.upsert({
    where: { slug: DEFAULT_TENANT_SLUG },
    update: { updatedAt: new Date() },
    create: {
      name: "Finbers Link",
      slug: DEFAULT_TENANT_SLUG,
      contactName: "Finbers Link",
      contactEmail: "hello@finberslink.com",
      planTier: "PROFESSIONAL",
      status: "ACTIVE",
    },
  });
}
