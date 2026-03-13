import "server-only";

import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@prisma/client";

import { verifyToken, type SessionPayload } from "@/lib/auth/jwt";
import { canAccessRoute, hasPermission, type Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

/**
 * Auth error for use in guards
 */
export class AuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Extract and verify JWT token from request cookies
 * Throws AuthError if token is invalid or missing
 */
export function extractSessionFromRequest(request: NextRequest): SessionPayload {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    throw new AuthError(401, "No access token provided");
  }

  try {
    return verifyToken(token);
  } catch (error) {
    throw new AuthError(401, "Invalid or expired access token");
  }
}

/**
 * Require authentication for an API route
 * Returns session payload if authenticated
 */
export function requireAuth(request: NextRequest): SessionPayload {
  try {
    return extractSessionFromRequest(request);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(401, "Authentication failed");
  }
}

/**
 * Require a specific role
 */
export function requireRole(session: SessionPayload, ...allowedRoles: Role[]): SessionPayload {
  if (!allowedRoles.includes(session.role)) {
    throw new AuthError(403, `Insufficient permissions. Required: ${allowedRoles.join(", ")}`);
  }
  return session;
}

/**
 * Require a specific permission
 */
export function requirePermission(session: SessionPayload, permission: Permission): SessionPayload {
  if (!hasPermission(session.role, permission)) {
    throw new AuthError(403, `Permission denied: ${permission}`);
  }
  return session;
}

/**
 * Require access to a specific route
 */
export function requireRouteAccess(session: SessionPayload, route: string): SessionPayload {
  if (!canAccessRoute(session.role, route)) {
    throw new AuthError(403, `Access denied to ${route}`);
  }
  return session;
}

/**
 * Fetch full user data for authenticated session
 */
export async function getSessionUser(session: SessionPayload) {
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      avatarUrl: true,
      tenantId: true,
      profile: true,
    },
  });

  if (!user) {
    throw new AuthError(404, "User not found");
  }

  if (user.status === "SUSPENDED") {
    throw new AuthError(403, "User account is suspended");
  }

  return user;
}

/**
 * Verify tenant access for multi-tenant operations
 */
export function requireTenant(session: SessionPayload, requiredTenantId?: string): string {
  if (!session.tenantId) {
    throw new AuthError(400, "Tenant information not found in session");
  }

  if (requiredTenantId && session.tenantId !== requiredTenantId) {
    throw new AuthError(403, "Tenant access denied");
  }

  return session.tenantId;
}

/**
 * Require superadmin - highest privilege level
 */
export function requireSuperAdmin(session: SessionPayload): SessionPayload {
  if (session.role !== "SUPER_ADMIN") {
    throw new AuthError(403, "This action requires superadmin privileges");
  }
  return session;
}

/**
 * Require admin or superadmin
 */
export function requireAdminOrSuperAdmin(session: SessionPayload): SessionPayload {
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    throw new AuthError(403, "This action requires admin privileges");
  }
  return session;
}

/**
 * Create error response for auth middleware
 */
export function createAuthErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Unexpected auth error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

/**
 * Wrap an API route handler with authentication
 * Usage:
 *   export const POST = withAuth(async (request, session) => {
 *     return NextResponse.json({ ... });
 *   });
 */
export function withAuth(
  handler: (request: NextRequest, session: SessionPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const session = extractSessionFromRequest(request);
      return await handler(request, session);
    } catch (error) {
      return createAuthErrorResponse(error);
    }
  };
}

/**
 * Wrap an API route handler with role requirement
 * Usage:
 *   export const POST = withRole("ADMIN", "SUPER_ADMIN", async (request, session) => {
 *     return NextResponse.json({ ... });
 *   });
 */
export function withRole(
  ...roles: [...Role[], (request: NextRequest, session: SessionPayload) => Promise<NextResponse>]
) {
  const handler = roles.pop() as (request: NextRequest, session: SessionPayload) => Promise<NextResponse>;
  const allowedRoles = roles as Role[];

  return async (request: NextRequest) => {
    try {
      const session = extractSessionFromRequest(request);
      requireRole(session, ...allowedRoles);
      return await handler(request, session);
    } catch (error) {
      return createAuthErrorResponse(error);
    }
  };
}

/**
 * Wrap an API route handler with permission requirement
 * Usage:
 *   export const POST = withPermission("manage:users", async (request, session) => {
 *     return NextResponse.json({ ... });
 *   });
 */
export function withPermission(
  permission: Permission,
  handler: (request: NextRequest, session: SessionPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const session = extractSessionFromRequest(request);
      requirePermission(session, permission);
      return await handler(request, session);
    } catch (error) {
      return createAuthErrorResponse(error);
    }
  };
}
