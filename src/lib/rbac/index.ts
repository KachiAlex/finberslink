/**
 * RBAC module barrel export
 * Provides role-based access control utilities
 */

export {
  hasPermission,
  canAccessRoute,
  getAccessibleRoutes,
  canManageRole,
  ROLE_HIERARCHY,
  PERMISSIONS,
  type Permission,
} from "@/lib/rbac";
