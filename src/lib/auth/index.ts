/**
 * Auth module barrel export
 * Provides all authentication and authorization utilities
 */

// JWT utilities
export {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  type SessionPayload,
  type TokenPair,
} from "@/lib/auth/jwt";

// Password utilities
export { hashPassword, verifyPassword } from "@/lib/auth/password";

// Cookie utilities
export { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";

// Session utilities
export {
  getSessionFromCookies,
  requireSession,
  type RequireSessionOptions,
} from "@/lib/auth/session";

// Auth guards for API routes
export {
  AuthError,
  extractSessionFromRequest,
  requireAuth,
  requireRole,
  requirePermission,
  requireRouteAccess,
  getSessionUser,
  requireTenant,
  requireSuperAdmin,
  requireAdminOrSuperAdmin,
  createAuthErrorResponse,
  withAuth,
  withRole,
  withPermission,
} from "@/lib/auth/guards";

// Constants
export { NOT_AUTH_REDIRECT, NOT_AUTH_REASON } from "@/lib/auth/constants";
