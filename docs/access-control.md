---
title: Role-Based Access & Sessions
---

## Overview
The application now centralizes authentication and role gates through `src/lib/auth/session.ts`. All layouts, dashboard pages, and server actions call `requireSession` (or `getSessionFromCookies` when read-only access is sufficient) to enforce:

- Presence of a valid JWT-backed session cookie (`access_token`).
- Allowed roles per surface (student, tutor, admin, superadmin).
- Tenant membership when required (all roles except `SUPER_ADMIN`).
- Consistent failure behavior: redirect to `/login?reason=not-authenticated` or throw `NotAuthenticatedError` on server actions.

The middleware mirrors this behavior so that edge redirects match the page-level experience.

## Dashboard Access Matrix
| Surface | Path Prefix | Required Role(s) | Tenant Required | Failure mode |
| --- | --- | --- | --- | --- |
| Student dashboard & jobs/notifications/forum creation | `/dashboard`, `/jobs`, `/notifications`, `/forum/new`, `/forum/[id]` (posting) | `STUDENT` | Yes | Layouts throw `NotAuthenticatedError`; user-facing redirect is `/login?reason=not-authenticated` |
| Tutor dashboard & forums | `/tutor`, `/tutor/forums` | `TUTOR` | Yes | Same as above |
| Admin console | `/admin/**` | `ADMIN`, `SUPER_ADMIN` | Yes (optional for `SUPER_ADMIN`) | Same |
| Superadmin console | `/superadmin/**` | `SUPER_ADMIN` | No | Same |

Other role-aware routes (e.g., job apply flow) call `requireSession` inside server actions before mutating data.

## Middleware Behavior
`src/middleware.ts` now:

1. Checks every protected route for a valid `access_token`.
2. Verifies JWT payload and ensures the role includes required tenant context.
3. Redirects any failure (missing token, invalid role, missing tenant) to `NOT_AUTH_REDIRECT` (`/login?reason=not-authenticated`).
4. Still re-routes superadmins away from `/dashboard` to `/superadmin` to avoid mixed experiences.

## Server Action Pattern
When writing new server actions:

```ts
"use server";
import { requireSession } from "@/lib/auth/session";

const session = await requireSession({
  allowedRoles: ["ADMIN"],
  requireTenant: true,
  failureMode: "error",
});
// Use session.sub for user ID
```

For read-only data fetches where anonymous access is allowed, prefer `getSessionFromCookies()` to avoid throwing.

## Testing Checklist
- Access each dashboard as the wrong role → expect `/login?reason=not-authenticated` redirect.
- Access each dashboard as the correct role with/without tenant (superadmin only bypasses tenant).
- Invoke server actions (e.g., admin course create, job apply) without cookies → expect `NotAuthenticatedError`.
- Confirm middleware prevents SUPER_ADMIN from loading `/dashboard`.
