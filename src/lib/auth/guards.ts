import { NextRequest, NextResponse } from "next/server";

export class AuthError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAuth(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!token) {
    throw new AuthError("Missing authorization token");
  }

  try {
    // Verify token (placeholder - implement actual verification)
    return { userId: "user-id", role: "USER" };
  } catch (error) {
    throw new AuthError("Invalid token");
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
  
  if (error instanceof Error && error.message.includes("Forbidden")) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}


export async function withAuth(request: NextRequest) {
  return requireAuth(request);
}

export async function requireRole(request: NextRequest, requiredRole: string) {
  const auth = await requireAuth(request);
  if (auth.role !== requiredRole) {
    throw new AuthError("Insufficient permissions");
  }
  return auth;
}

export async function getSessionUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return null;
  }
  
  try {
    return { userId: "user-id", role: "USER" };
  } catch {
    return null;
  }
}

export async function requirePermission(request: NextRequest, permission: string) {
  const auth = await requireAuth(request);
  // Placeholder: check if user has permission
  return auth;
}

export async function requireRouteAccess(request: NextRequest, route: string) {
  const auth = await requireAuth(request);
  // Placeholder: check if user has access to route
  return auth;
}

export async function requireTenant(request: NextRequest, tenantId: string) {
  const auth = await requireAuth(request);
  // Placeholder: check if user belongs to tenant
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

export function createAuthErrorResponse(message: string, status: number = 401) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

export async function withRole(request: NextRequest, role: string) {
  return requireRole(request, role);
}

export async function withPermission(request: NextRequest, permission: string) {
  return requirePermission(request, permission);
}
