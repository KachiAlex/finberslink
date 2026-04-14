import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./jwt";

export class AuthError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAuth(request: NextRequest) {
  // Try Authorization header first, then cookie
  let token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    token = request.cookies.get("access_token")?.value;
  }

  if (!token) {
    throw new AuthError("Missing authorization token");
  }

  try {
    const payload = await verifyAccessToken(token);
    return { userId: payload.sub, sub: payload.sub, role: payload.role, tenantId: payload.tenantId, email: payload.email };
  } catch {
    throw new AuthError("Invalid token");
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof Error && error.message.includes("Forbidden")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function withAuth(request: NextRequest) {
  return requireAuth(request);
}

export async function getSessionUser(request: NextRequest) {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}

export async function requireRole(request: NextRequest, requiredRole: string) {
  const auth = await requireAuth(request);
  if (auth.role !== requiredRole) throw new AuthError("Insufficient permissions");
  return auth;
}

export async function requireSuperAdmin(request: NextRequest) {
  return requireRole(request, "SUPER_ADMIN");
}

export async function requireAdminOrSuperAdmin(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    throw new AuthError("Admin access required");
  }
  return auth;
}

export function createAuthErrorResponse(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}

export async function withRole(request: NextRequest, role: string) {
  return requireRole(request, role);
}

export async function requirePermission(request: NextRequest, _permission: string) {
  return requireAuth(request);
}

export async function withPermission(request: NextRequest, permission: string) {
  return requirePermission(request, permission);
}

export async function requireRouteAccess(request: NextRequest, _route: string) {
  return requireAuth(request);
}

export async function requireTenant(request: NextRequest, _tenantId: string) {
  return requireAuth(request);
}
