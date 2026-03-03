import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createTenant,
  listTenants,
} from "@/features/superadmin/tenant-service";
import { requireSuperAdminUser } from "@/features/superadmin/service";
import { verifyToken } from "@/lib/auth/jwt";

const ListTenantSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"]).optional(),
  planTier: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  includeArchived: z
    .string()
    .optional()
    .transform(value => value === "true"),
});

const CreateTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  planTier: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  seatLimit: z.number().int().positive().optional(),
  seatAllocated: z.number().int().nonnegative().optional(),
  licenseExpiresAt: z.coerce.date().optional().nullable(),
  domain: z.string().optional().nullable(),
  featureFlags: z.record(z.boolean()).optional(),
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

export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireSuperAdminUser(session.sub);

  const { searchParams } = new URL(request.url);
  const filters = ListTenantSchema.parse(Object.fromEntries(searchParams));

  const tenants = await listTenants(filters);
  return NextResponse.json({ tenants });
}

export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireSuperAdminUser(session.sub);

  const body = await request.json();
  const data = CreateTenantSchema.parse(body);

  const tenant = await createTenant({
    name: data.name,
    slug: data.slug,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    logoUrl: data.logoUrl,
    planTier: data.planTier,
    seatLimit: data.seatLimit,
    seatAllocated: data.seatAllocated,
    licenseExpiresAt: data.licenseExpiresAt ?? null,
    domain: data.domain,
    featureFlags: data.featureFlags,
  });

  return NextResponse.json({ tenant }, { status: 201 });
}
