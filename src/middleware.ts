import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { env } from "@/lib/env";

// Routes that require authentication
const protectedRoutes = [
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
const roleBasedRoutes = {
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/superadmin": ["SUPER_ADMIN"],
  "/tutor": ["TUTOR"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get("access_token")?.value;
  
  if (!accessToken) {
    // Redirect to login for protected routes
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token using Web Crypto (edge-safe)
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(env.JWT_ACCESS_SECRET),
      { algorithms: ["HS256"] }
    );
    const role = (payload as any)?.role;

    // Route SUPER_ADMIN away from learner dashboard to superadmin console
    if (pathname.startsWith("/dashboard") && role === "SUPER_ADMIN") {
      const superAdminUrl = new URL("/superadmin", request.url);
      return NextResponse.redirect(superAdminUrl);
    }
    
    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(role as any)) {
          // Redirect to appropriate dashboard based on role
          const redirectUrl = new URL(
            role === "TUTOR" ? "/tutor" : "/dashboard",
            request.url
          );
          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Token is invalid, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
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
