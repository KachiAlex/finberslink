import { randomBytes } from "crypto";
import type { Prisma, TenantPlanTier, TenantStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type ListTenantsFilters = {
  search?: string;
  status?: TenantStatus;
  planTier?: TenantPlanTier;
  includeArchived?: boolean;
};

type CreateTenantInput = {
  name: string;
  slug: string;
  contactName?: string | null;
  contactEmail?: string | null;
  logoUrl?: string | null;
  planTier?: TenantPlanTier;
  seatLimit?: number;
  seatAllocated?: number;
  licenseExpiresAt?: Date | null;
  domain?: string | null;
  featureFlags?: Record<string, boolean>;
};

type UpdateTenantInput = Partial<
  Pick<
    CreateTenantInput,
    | "name"
    | "slug"
    | "contactName"
    | "contactEmail"
    | "logoUrl"
    | "planTier"
    | "seatLimit"
    | "seatAllocated"
    | "licenseExpiresAt"
    | "domain"
    | "featureFlags"
  >
> & {
  status?: TenantStatus;
};

function buildTenantWhere(filters: ListTenantsFilters): Prisma.TenantWhereInput {
  const where: Prisma.TenantWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
      { contactEmail: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.planTier) {
    where.planTier = filters.planTier;
  }

  if (!filters.includeArchived) {
    where.archivedAt = null;
  }

  return where;
}

export async function listTenants(filters: ListTenantsFilters = {}) {
  return prisma.tenant.findMany({
    where: buildTenantWhere(filters),
    orderBy: { createdAt: "desc" },
    include: {
      settings: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });
}

export async function getTenantById(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      settings: true,
      users: {
        where: { role: "ADMIN" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
        },
      },
      usage: {
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  });
}

export async function createTenant(input: CreateTenantInput) {
  const seatLimit = input.seatLimit ?? 100;
  if (seatLimit <= 0) {
    throw new Error("Seat limit must be greater than zero");
  }

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        logoUrl: input.logoUrl,
        planTier: input.planTier ?? "PROFESSIONAL",
        seatLimit,
        seatAllocated: input.seatAllocated ?? 0,
        licenseExpiresAt: input.licenseExpiresAt ?? null,
      },
    });

    await tx.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        domain: input.domain,
        featureFlags: input.featureFlags ?? {},
      },
    });

    return getTenantById(tenant.id);
  });
}

export async function updateTenant(tenantId: string, data: UpdateTenantInput) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { seatAllocated: true },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  if (data.seatLimit !== undefined && data.seatLimit < tenant.seatAllocated) {
    throw new Error("Seat limit cannot be lower than seats already allocated");
  }

  const { domain, featureFlags, ...tenantData } = data;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: tenantData,
  });

  if (domain !== undefined || featureFlags !== undefined) {
    await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        domain,
        featureFlags: featureFlags ?? Prisma.JsonNull,
      },
      create: {
        tenantId,
        domain,
        featureFlags: featureFlags ?? {},
      },
    });
  }

  return getTenantById(tenantId);
}

export async function setTenantStatus(tenantId: string, status: TenantStatus) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status },
  });

  return getTenantById(tenantId);
}

export async function archiveTenant(tenantId: string) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      status: "CANCELLED",
      archivedAt: new Date(),
    },
  });

  return getTenantById(tenantId);
}

export async function createTenantAdminInvite(input: {
  tenantId: string;
  email: string;
  createdById: string;
  expiresAt?: Date;
}) {
  return prisma.tenantInvite.create({
    data: {
      tenantId: input.tenantId,
      email: input.email.toLowerCase(),
      role: "ADMIN",
      token: randomBytes(16).toString("hex"),
      expiresAt: input.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      createdById: input.createdById,
    },
  });
}
