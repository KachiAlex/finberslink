import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { Role } from "@prisma/client";

import type { SessionPayload } from "@/lib/auth/jwt";
import { env } from "./lib/env";
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
  "/courses",
];

// Routes that require specific roles
const roleBasedRoutes: Record<string, Role[]> = {
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/superadmin": ["SUPER_ADMIN"],
  "/tutor": ["TUTOR"],
};

function isPublicResumeRoute(pathname: string) {
  if (pathname.startsWith("/resume/share/")) {
    return true;
  }

  // Keep direct resume view routes public while edit/preview remains protected.
  const publicResumeMatcher = /^\/resume\/[^/]+\/?$/;
  return publicResumeMatcher.test(pathname);
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL(NOT_AUTH_REDIRECT, request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieHeader = request.headers.get("cookie") ?? "";

  if (isPublicResumeRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for access token
  let accessToken = request.cookies.get("access_token")?.value;
  // Fallback: parse raw Cookie header if request.cookies didn't yield the token
  if (!accessToken && cookieHeader) {
    try {
      const parts = cookieHeader.split(';').map(p => p.trim());
      for (const p of parts) {
        if (p.startsWith('access_token=')) {
          accessToken = p.replace('access_token=', '');
          break;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const now = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[middleware:${now}] request.nextUrl.pathname:`, pathname);
  }

  if (!accessToken) {
    return redirectToLogin(request, pathname);
  }

  if (process.env.NODE_ENV !== "production") {
    // Debug: log presence of access token for e2e troubleshooting
    // eslint-disable-next-line no-console
    console.log(`[middleware] accessToken present: ${Boolean(accessToken)}`);
  }

  try {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
        console.log(`[middleware:${new Date().toISOString()}] verifying access token`);
    }
    // Verify token using Web Crypto (edge-safe)
    const verified = await jwtVerify(accessToken, new TextEncoder().encode(env.JWT_ACCESS_SECRET), { algorithms: ["HS256"] });
    const session = verified.payload as unknown as SessionPayload;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
        console.log(`[middleware:${new Date().toISOString()}] token verified`, { sub: session.sub, role: session.role });
    }
    const role = session.role;

    if (!role) {
      return redirectToLogin(request, pathname);
    }

    const tenantId = session.tenantId;
    const tenantOptional = role === "SUPER_ADMIN";

    // Allow students without a tenant (local/dev demo users). Require tenant for other roles.
    if (role !== "STUDENT" && !tenantId && !tenantOptional) {
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
