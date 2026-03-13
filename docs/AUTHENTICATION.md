# Authentication System Documentation

## Overview

The Finbers Link authentication system is built on industry-standard security practices with the following components:

- **JWT Tokens**: Access tokens (1h) and refresh tokens (30d)
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Role-Based Access Control (RBAC)**: Permission matrix for 5 roles
- **Multi-tenant Support**: Tenant ID in session payload for tenant isolation
- **Middleware Protection**: Route guards for protected pages
- **API Guards**: Server-side utilities for protecting API routes and server actions

## Roles & Permissions

### Role Hierarchy

1. **STUDENT** - Learner accessing courses and opportunities
2. **TUTOR** - Content creator teaching courses
3. **EMPLOYER** - Job poster and application reviewer
4. **ADMIN** - Tenant-level administrator (courses, users, moderation)
5. **SUPER_ADMIN** - Platform superadmin (tenant management, billing)

### Permission Matrix

Each role has specific permissions defined in `src/lib/rbac.ts`:

```typescript
STUDENT: [
  "read:course", "enroll:course", "read:job", "apply:job",
  "read:volunteer", "apply:volunteer", "read:news"
]

TUTOR: [
  "create:course", "read:course", "update:course", "delete:course",
  "read:job", "read:volunteer", "read:news", "moderate:forum"
]

EMPLOYER: [
  "create:job", "read:job", "update:job", "delete:job",
  "review:applications", "read:news"
]

ADMIN: [
  // All above + admin-specific permissions
  "read:admin", "write:admin", "manage:users", "moderate:forum",
  "create:news", "update:news", "delete:news"
]

SUPER_ADMIN: [
  // All above + superadmin-specific
  "read:superadmin", "write:superadmin", "manage:tenants", "manage:billing"
]
```

## API Endpoints

### POST `/api/auth/register`

Register a new user.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "STUDENT"  // optional: STUDENT | TUTOR | EMPLOYER
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": { "email": "john@example.com" }
}
```

Sets `access_token` and `refresh_token` cookies.

### POST `/api/auth/login`

Authenticate user and receive tokens.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": { 
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

Sets `access_token` and `refresh_token` cookies.

### POST `/api/auth/refresh`

Refresh the access token using refresh token.

**Response (200):**
```json
{ "message": "Session refreshed" }
```

Updates `access_token` cookie.

### POST `/api/auth/logout`

Clear authentication cookies.

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

### GET `/api/auth/me`

Get current authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": "...",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "status": "ACTIVE",
    "tenantId": "...",
    // ... other fields
  }
}
```

### POST `/api/auth/forgot-password`

Request password reset email.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{ "message": "If user exists, reset email sent" }
```

### POST `/api/auth/reset-password`

Reset password with token.

**Request:**
```json
{
  "token": "{{reset_token}}",
  "password": "NewSecurePass123"
}
```

**Response (200):**
```json
{ "message": "Password reset successfully" }
```

## Server-Side Auth Guards

### In API Routes

Use guards to protect API routes:

```typescript
// Basic authentication
import { withAuth, extractSessionFromRequest } from "@/lib/auth/guards";

export const GET = withAuth(async (request, session) => {
  // session contains { sub, role, status, tenantId }
  return NextResponse.json({ userId: session.sub });
});

// Role-based access
import { withRole } from "@/lib/auth/guards";

export const DELETE = withRole("ADMIN", "SUPER_ADMIN", async (request, session) => {
  // Only ADMIN or SUPER_ADMIN can access
  return NextResponse.json({ message: "Deleted" });
});

// Permission-based access
import { withPermission } from "@/lib/auth/guards";

export const POST = withPermission("manage:users", async (request, session) => {
  // Only users with manage:users permission
  return NextResponse.json({ message: "User managed" });
});
```

### Manual Guard Usage

```typescript
import { 
  extractSessionFromRequest, 
  requireRole, 
  requirePermission,
  getSessionUser 
} from "@/lib/auth/guards";

export async function POST(request: NextRequest) {
  try {
    const session = extractSessionFromRequest(request);
    requireRole(session, "ADMIN");
    
    const user = await getSessionUser(session);
    // ... perform admin action
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
```

## Server Components/Actions

Use session utilities for server components and actions:

```typescript
import { requireSession, getSessionFromCookies } from "@/lib/auth/session";
import { hasPermission } from "@/lib/rbac";

// In server component
export default async function AdminDashboard() {
  const session = await requireSession({ 
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    redirectTo: "/login"
  });
  
  return <div>Welcome {session.role}</div>;
}

// In server action
"use server"

export async function deleteUser(userId: string) {
  const session = await requireSession({ 
    allowedRoles: ["ADMIN", "SUPER_ADMIN"]
  });
  
  if (!hasPermission(session.role, "manage:users")) {
    throw new Error("Permission denied");
  }
  
  // Perform deletion...
}

// Optional session (doesn't redirect)
async function HomePage() {
  const session = await getSessionFromCookies();
  
  return (
    <div>
      {session ? (
        <p>Welcome {session.role}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## Client-Side Session

Get session on client side:

```typescript
import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => setSession(data.user))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  return { session, loading };
}
```

## Multi-Tenant Session

The session payload includes `tenantId` for multi-tenant isolation:

```typescript
import { requireTenant } from "@/lib/auth/guards";

export async function POST(request: NextRequest) {
  const session = extractSessionFromRequest(request);
  const tenantId = requireTenant(session); // Ensures tenant in session
  
  // Verify user owns the resource in this tenant
  const resource = await db.resource.findFirst({
    where: {
      id: resourceId,
      tenantId: tenantId  // Enforce tenant boundary
    }
  });
}
```

## Middleware Protection

Protected routes are defined in `src/middleware.ts`:

```typescript
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

const roleBasedRoutes = {
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/superadmin": ["SUPER_ADMIN"],
  "/tutor": ["TUTOR"],
};
```

Access to protected routes requires valid JWT token.
Access to role-based routes checks role in middleware.

## Security Best Practices

1. **HTTPS Only**: Cookies set with `secure: true` in production
2. **HttpOnly Cookies**: Tokens stored in HttpOnly cookies, not localStorage
3. **CSRF Protection**: SameSite=Lax on cookies
4. **Token Expiry**: Access tokens expire in 1 hour, refresh in 30 days
5. **Password Hashing**: bcrypt with 12 salt rounds
6. **Tenant Isolation**: Enforce tenantId in all multi-tenant queries
7. **Rate Limiting**: Recommended for auth endpoints (TODO)
8. **Audit Logging**: Recommended for admin actions (TODO)

## Environment Variables

Required:
- `JWT_ACCESS_SECRET` - Secret key for signing access tokens
- `JWT_REFRESH_SECRET` - Secret key for signing refresh tokens
- `DATABASE_URL` - Prisma database connection

Optional:
- `SENDGRID_API_KEY` - For password reset emails
- `NEXTAUTH_URL` - For password reset link generation
- `NEXT_PUBLIC_APP_URL` - Fallback for app URL

## Testing

Example test for auth endpoints:

```typescript
describe("Auth", () => {
  it("should register user", async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "Password123"
      })
    });
    expect(res.status).toBe(201);
  });

  it("should login user", async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123"
      })
    });
    expect(res.status).toBe(200);
  });

  it("should deny invalid credentials", async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "WrongPassword"
      })
    });
    expect(res.status).toBe(401);
  });
});
```

## Troubleshooting

### "Invalid or expired access token"
- Tokens expire in 1 hour
- Use `/api/auth/refresh` to get new token
- Clear cookies and login again

### "Insufficient permissions"
- User role doesn't have required permission
- Check RBAC matrix in `src/lib/rbac.ts`
- Admin may need to update user role

### "Tenant access denied"
- User doesn't have access to requested tenant
- Ensure tenantId in URL matches session tenantId

### CORS Issues
- Auth cookies require same-origin fetch
- Use `credentials: 'include'` in fetch calls
- Ensure request headers include credentials
