import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  archiveTenant,
  createTenantAdminInvite,
  getTenantById,
  setTenantStatus,
  updateTenant,
} from "@/features/superadmin/tenant-service";
import { requireSuperAdminUser } from "@/features/superadmin/service";
import { parseUserFromRequest } from "@/lib/http/parse-user";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const user = await parseUserFromRequest(request);
  await requireSuperAdminUser(user?.sub);

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
  const user = await parseUserFromRequest(request);
  await requireSuperAdminUser(user?.sub);

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
  const user = await parseUserFromRequest(request);
  await requireSuperAdminUser(user?.sub);

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
      createdById: user?.sub ?? "system",
      expiresAt: payload.expiresAt,
    });
    return NextResponse.json({ invite }, { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
