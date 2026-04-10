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
} from "./jwt";

// Password utilities
export { hashPassword, verifyPassword } from "./password";

// Cookie utilities
export { setAuthCookies, clearAuthCookies } from "./cookies";

// Session utilities
export {
  getSessionFromCookies,
  requireSession,
  type RequireSessionOptions,
} from "./session";

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
} from "./guards";

// Constants
export { NOT_AUTH_REDIRECT, NOT_AUTH_REASON } from "./constants";
