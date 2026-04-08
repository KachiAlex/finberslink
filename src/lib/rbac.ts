import type { Role } from "@prisma/client";

/**
 * RBAC (Role-Based Access Control) Matrix
 * Defines what permissions each role has across the application
 */

export type Permission =
  | "create:course"
  | "read:course"
  | "update:course"
  | "delete:course"
  | "create:job"
  | "read:job"
  | "update:job"
  | "delete:job"
  | "create:volunteer"
  | "read:volunteer"
  | "update:volunteer"
  | "delete:volunteer"
  | "create:news"
  | "read:news"
  | "update:news"
  | "delete:news"
  | "read:admin"
  | "write:admin"
  | "read:superadmin"
  | "write:superadmin"
  | "manage:users"
  | "manage:tenants"
  | "manage:billing"
  | "moderate:forum"
  | "review:applications"
  | "enroll:course"
  | "apply:job"
  | "apply:volunteer";

/**
 * Role hierarchy from least to most privileged
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  STUDENT: 1,
  TUTOR: 2,
  EMPLOYER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Permission matrix: defines which roles have which permissions
 */
export const PERMISSIONS: Record<Role, Permission[]> = {
  STUDENT: [
    "read:course",
    "enroll:course",
    "read:job",
    "apply:job",
    "read:volunteer",
    "apply:volunteer",
    "read:news",
  ],
  TUTOR: [
    "create:course",
    "read:course",
    "update:course",
    "delete:course",
    "read:job",
    "read:volunteer",
    "read:news",
    "moderate:forum",
  ],
  EMPLOYER: [
    "create:job",
    "read:job",
    "update:job",
    "delete:job",
    "review:applications",
    "read:news",
  ],
  ADMIN: [
    // All student permissions
    "read:course",
    "enroll:course",
    "read:job",
    "read:volunteer",
    "read:news",
    // All tutor permissions
    "create:course",
    "update:course",
    "delete:course",
    // All employer permissions
    "create:job",
    "update:job",
    "delete:job",
    "review:applications",
    // Admin-specific
    "read:admin",
    "write:admin",
    "manage:users",
    "moderate:forum",
    "create:news",
    "update:news",
    "delete:news",
  ],
  SUPER_ADMIN: [
    // All admin permissions
    "read:course",
    "enroll:course",
    "read:job",
    "read:volunteer",
    "read:news",
    "create:course",
    "update:course",
    "delete:course",
    "create:job",
    "update:job",
    "delete:job",
    "review:applications",
    "read:admin",
    "write:admin",
    "manage:users",
    "moderate:forum",
    "create:news",
    "update:news",
    "delete:news",
    // Superadmin-specific
    "read:superadmin",
    "write:superadmin",
    "manage:tenants",
    "manage:billing",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: Role, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    "/admin": ["read:admin"],
    "/superadmin": ["read:superadmin"],
    "/tutor": ["read:course"],
    "/dashboard": ["read:course"],
  };

  const required = routePermissions[route];
  if (!required) return true; // Public route

  return required.some(perm => hasPermission(role, perm));
}

/**
 * Get all accessible routes for a role
 */
export function getAccessibleRoutes(role: Role): string[] {
  const routes: string[] = [];
  const adminRoutes: Record<string, Permission[]> = {
    "/dashboard": ["read:course"],
    "/courses": ["read:course"],
    "/jobs": ["read:job"],
    "/volunteer": ["read:volunteer"],
    "/admin": ["read:admin"],
    "/superadmin": ["read:superadmin"],
    "/tutor": ["read:course"],
  };

  for (const [route, permissions] of Object.entries(adminRoutes)) {
    if (permissions.some(perm => hasPermission(role, perm))) {
      routes.push(route);
    }
  }

  return routes;
}

/**
 * Check if one role can manage another
 * Higher role hierarchy can manage lower roles
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}
