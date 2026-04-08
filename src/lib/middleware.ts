import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

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

export function middleware(request: NextRequest) {
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

  // Dev debug: log whether access token cookie is present (do not print full token in prod)
  if (process.env.NODE_ENV !== "production") {
    console.log("[middleware] checking access_token cookie presence: ", Boolean(accessToken));
    try {
      const cookieHeader = request.headers.get('cookie');
      console.log('[middleware] incoming Cookie header:', cookieHeader);
    } catch (e) {
      console.warn('[middleware] could not read cookie header', e);
    }
  }

  if (!accessToken) {
    // Redirect to login for protected routes
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token
    const payload = verifyToken(accessToken);

    if (process.env.NODE_ENV !== "production") {
      console.log("[middleware] token verified, payload:", JSON.stringify({ id: payload.sub, role: payload.role }));
    }

    // Route SUPER_ADMIN away from learner dashboard to superadmin console
    if (pathname.startsWith("/dashboard") && payload.role === "SUPER_ADMIN") {
      const superAdminUrl = new URL("/superadmin", request.url);
      return NextResponse.redirect(superAdminUrl);
    }
    
    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(payload.role)) {
          // Redirect to appropriate dashboard based on role
          const redirectUrl = new URL(
            payload.role === "TUTOR" ? "/tutor" : "/dashboard",
            request.url
          );
          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Dev debug: log token verification failure
    if (process.env.NODE_ENV !== "production") {
      console.error("[middleware] token verification failed:", error);
    }

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
