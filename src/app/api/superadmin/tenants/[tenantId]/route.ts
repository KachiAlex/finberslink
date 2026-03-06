import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserStatus } from "@prisma/client";

import {
  archiveTenant,
  createTenantAdminInvite,
  getTenantById,
  setTenantStatus,
  updateTenant,
} from "@/features/superadmin/tenant-service";
import { findUserByEmail } from "@/features/auth/repository";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminUser } from "@/features/superadmin/service";
import { verifyToken } from "@/lib/auth/jwt";

const ParamsSchema = z.object({
  tenantId: z.string().min(1),
});

const UpdateTenantSchema = z.object({
  name: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  planTier: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  seatLimit: z.number().int().positive().optional(),
  seatAllocated: z.number().int().nonnegative().optional(),
  licenseExpiresAt: z.coerce.date().optional().nullable(),
  domain: z.string().optional().nullable(),
  featureFlags: z.record(z.boolean()).optional(),
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"]).optional(),
});

const StatusSchema = z.object({
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"]),
});

const AdminInviteSchema = z.object({
  email: z.string().email(),
  expiresAt: z.coerce.date().optional(),
});

const AdminCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
});

const AdminStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.nativeEnum(UserStatus),
});

const AdminResetSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(6),
});

function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireSuperAdminUser(session.sub);

  const { tenantId } = ParamsSchema.parse(await params);
  const tenant = await getTenantById(tenantId);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireSuperAdminUser(session.sub);

  const { tenantId } = ParamsSchema.parse(await params);
  const body = await request.json();
  const data = UpdateTenantSchema.parse(body);

  const tenant = await updateTenant(tenantId, data);
  return NextResponse.json({ tenant });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireSuperAdminUser(session.sub);

  const { tenantId } = ParamsSchema.parse(await params);
  const body = await request.json();

  if (body.action === "status") {
    const { status } = StatusSchema.parse(body.payload);
    const tenant = await setTenantStatus(tenantId, status);
    return NextResponse.json({ tenant });
  }

  if (body.action === "archive") {
    const tenant = await archiveTenant(tenantId);
    return NextResponse.json({ tenant });
  }

  if (body.action === "admin-invite") {
    const payload = AdminInviteSchema.parse(body.payload);
    const invite = await createTenantAdminInvite({
      tenantId,
      email: payload.email,
      createdById: session.sub ?? "system",
      expiresAt: payload.expiresAt,
    });
    return NextResponse.json({ invite }, { status: 201 });
  }

  if (body.action === "admin-create") {
    const payload = AdminCreateSchema.parse(body.payload);
    const existing = await findUserByEmail(payload.email.toLowerCase());
    const passwordHash = await hashPassword(payload.password);

    const user = await prisma.user.upsert({
      where: { email: payload.email.toLowerCase() },
      update: {
        firstName: payload.firstName ?? undefined,
        lastName: payload.lastName ?? undefined,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        tenantId,
      },
      create: {
        email: payload.email.toLowerCase(),
        firstName: payload.firstName ?? "",
        lastName: payload.lastName ?? "",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        tenantId,
      },
    });

    return NextResponse.json({ user }, { status: existing ? 200 : 201 });
  }

  if (body.action === "admin-status") {
    const payload = AdminStatusSchema.parse(body.payload);
    const user = await prisma.user.update({
      where: { id: payload.userId, tenantId },
      data: { status: payload.status },
    });
    return NextResponse.json({ user });
  }

  if (body.action === "admin-reset-password") {
    const payload = AdminResetSchema.parse(body.payload);
    const passwordHash = await hashPassword(payload.password);
    const user = await prisma.user.update({
      where: { id: payload.userId, tenantId },
      data: { passwordHash },
    });
    return NextResponse.json({ user });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
