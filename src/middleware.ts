import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { Role } from "@prisma/client";

import type { SessionPayload } from "@/lib/auth/jwt";
import { env } from "@/lib/env";

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
  const loginUrl = new URL("/login", request.url);
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
    const { payload } = await jwtVerify(accessToken, new TextEncoder().encode(env.JWT_ACCESS_SECRET), { algorithms: ["HS256"] }) as any;
    const role = (payload as SessionPayload).role;

    if (!role) {
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
        // Redirect to appropriate dashboard based on role
        const redirectUrl = new URL(role === "TUTOR" ? "/tutor" : "/dashboard", request.url);
        return NextResponse.redirect(redirectUrl);
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
