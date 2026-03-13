import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { Role } from "@prisma/client";

import type { SessionPayload } from "@/lib/auth/jwt";
import { env } from "@/lib/env";
import { NOT_AUTH_REDIRECT } from "@/lib/auth/constants";

// Routes that require authentication
const protectedRoutes: readonly string[] = [
  "/dashboard",
  "/admin",
  "/superadmin",
  "/tutor",
  "/notifications",
  "/resume",
  "/forum/new",
  "/search",
];

// Routes that require specific roles
const roleBasedRoutes: Record<string, Role[]> = {
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/superadmin": ["SUPER_ADMIN"],
  "/tutor": ["TUTOR"],
};

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL(NOT_AUTH_REDIRECT, request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return redirectToLogin(request, pathname);
  }

  try {
    // Verify token using Web Crypto (edge-safe)
    const verified = await jwtVerify(accessToken, new TextEncoder().encode(env.JWT_ACCESS_SECRET), { algorithms: ["HS256"] });
    const session = verified.payload as unknown as SessionPayload;
    const role = session.role;

    if (!role) {
      return redirectToLogin(request, pathname);
    }

    const tenantId = session.tenantId;
    const tenantOptional = role === "SUPER_ADMIN";

    if (!tenantId && !tenantOptional) {
      return redirectToLogin(request, pathname);
    }

    // Route SUPER_ADMIN away from learner dashboard to superadmin console
    if (pathname.startsWith("/dashboard") && role === "SUPER_ADMIN") {
      const superAdminUrl = new URL("/superadmin", request.url);
      return NextResponse.redirect(superAdminUrl);
    }

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        return redirectToLogin(request, pathname);
      }
    }

    return NextResponse.next();
  } catch {
    // Token is invalid, redirect to login
    return redirectToLogin(request, pathname);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
