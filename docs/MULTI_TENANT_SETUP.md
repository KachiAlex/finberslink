# Task 18: Multi-Tenant Architecture Implementation

## Status: IN PROGRESS

Task 18 extends the Prisma schema and codebase to support multi-tenant operations. This document outlines what has been implemented, what remains, and provides operational guidance.

---

## ✅ Completed: Data Model & Schema

### Tenant Models (Already in Prisma)

The following models are fully defined in `prisma/schema.prisma`:

#### 1. **Tenant Model**
```prisma
model Tenant {
  id                String    @id @default(cuid())
  name              String
  slug              String    @unique
  planTier          TenantPlanTier = PROFESSIONAL
  status            TenantStatus   = ACTIVE
  contactName       String?
  contactEmail      String?
  logoUrl           String?
  seatLimit         Int            = 100
  seatAllocated     Int            = 0
  licenseExpiresAt  DateTime?
  archivedAt        DateTime?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  
  settings          TenantSettings?
  users             User[]
  invites           TenantInvite[]
  usage             TenantUsage[]
}
```

**Key Fields:**
- `slug`: Unique identifier (e.g., "finbers-link") for multi-tenancy routing
- `planTier`: Billing tier (STARTER, PROFESSIONAL, ENTERPRISE)
- `status`: Tenant lifecycle (ACTIVE, SUSPENDED, CANCELLED)
- `seatLimit`: Maximum concurrent users per tenant
- `seatAllocated`: Currently allocated seats
- `licenseExpiresAt`: License expiration for time-based billing

#### 2. **TenantSettings Model**
```prisma
model TenantSettings {
  id              String   @id @default(cuid())
  tenantId        String   @unique
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  domain          String?  @unique
  featureFlags    Json     @default("{}")
  themeOverrides  Json?
  primaryColor    String?  @default("#3B82F6")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Use Cases:**
- Store custom domain mapping (e.g., tenant.example.com)
- Feature flags per tenant (e.g., enableAI, enableGuardianMode)
- Brand customization (theme colors, logo overrides)

#### 3. **TenantInvite Model**
```prisma
model TenantInvite {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  email       String
  role        String   // USER_ADMIN, USER_SUPPORT, etc.
  token       String   @unique
  expiresAt   DateTime
  claimedAt   DateTime?
  createdById String
  createdBy   User     @relation("TenantInviteCreatedBy", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId])
  @@index([email])
  @@index([token])
}
```

**Workflow:**
1. Superadmin invites tenant admin via email
2. Generates unique token with 7-day expiry
3. Admin claims invite by signing up with token
4. Tenant-specific admin privileges granted

#### 4. **TenantUsage Model**
```prisma
model TenantUsage {
  id                String   @id @default(cuid())
  tenantId          String
  tenant            Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  month             DateTime
  activeStudents    Int      = 0
  activeTutors      Int      = 0
  activeJobs        Int      = 0
  storageUsedMb     Float    = 0
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([tenantId, month])
  @@index([tenantId])
  @@index([month])
}
```

**Monthly Billing Metrics:**
- Tracks active user counts per role
- Monitors storage consumption
- Used for billing calculations and quota enforcement

#### 5. **User Model Updates**
```prisma
model User {
  // ... existing fields ...
  tenantId          String?
  tenant            Tenant?  @relation(fields: [tenantId], references: [id])
  
  // ... rest of model ...
}
```

**Multi-Tenant Behavior:**
- `tenantId` is optional (nullable) to support platform superadmins
- Users with `tenantId` belong to a specific tenant
- Users without `tenantId` have platform-wide access (SUPER_ADMIN only)

#### 6. **Enums**
```prisma
enum TenantPlanTier {
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
}
```

---

## ✅ Completed: Service Layer

The tenant service layer is fully implemented in `src/features/superadmin/tenant-service.ts` with the following operations:

### Read Operations
- `listTenants(filters)` - List with search, status, plan tier filters
- `getTenantById(tenantId)` - Get single tenant with usage stats

### Write Operations
- `createTenant(input)` - Create new tenant with settings
- `updateTenant(tenantId, data)` - Update tenant fields
- `setTenantStatus(tenantId, status)` - Change status
- `archiveTenant(tenantId)` - Soft-delete tenant

### Administrative
- `createTenantAdminInvite(input)` - Generate admin invitations

All operations include proper validation, error handling, and transaction support.

---

## ✅ Completed: Authentication & Session

### SessionPayload Enhancement
```typescript
export interface SessionPayload {
  sub: string;                  // User ID
  role: Role;                   // User role
  status: UserStatus;           // User status
  tenantId?: string | null;     // Tenant assignment
}
```

### Auth Flow Integration
1. **Registration**: `registerUser(input, tenantId)` assigns new users to default tenant
2. **Login**: `loginUser(input)` retrieves user's tenantId and includes in session
3. **Refresh**: `refreshSession(refreshToken)` preserves tenantId

### Middleware Tenant Handling
```typescript
// middleware.ts
const tenantId = session.tenantId;
const tenantOptional = role === "SUPER_ADMIN";

if (!tenantId && !tenantOptional) {
  return redirectToLogin(request, pathname);
}
```

**Rules:**
- All non-superadmin users must have tenantId
- SUPER_ADMIN users can omit tenantId (platform-wide access)
- Middleware enforces tenant validation on protected routes

---

## ✅ Completed: Seeding

### Default Tenant Creation
File: `prisma/seed.ts`

The seed script automatically:
1. Creates or updates the "Finbers Link" default tenant
2. Creates the platform superadmin account
3. Assigns superadmin to default tenant

```bash
npx prisma db seed
```

---

## ⏳ Remaining: User Migration Script

### Purpose
Migrate existing users (created before multi-tenant support) to the default tenant.

### Migration Script
File: `scripts/migrate-users-to-default-tenant.ts`

**What it does:**
1. Gets or creates the default "Finbers Link" tenant
2. Finds all users with `tenantId = null`
3. Assigns them to the default tenant in batches
4. Verifies all users have been assigned
5. Generates detailed migration report

**How to run:**
```bash
npm exec ts-node scripts/migrate-users-to-default-tenant.ts
```

**Output Example:**
```
======================================================================
USER TO DEFAULT TENANT MIGRATION
======================================================================
✓ Default tenant ready: tenant_finbers (Finbers Link)

Total users in database: 145
Users without tenant assignment: 127
  [100/127] Users updated...
  [127/127] Users updated...

✓ Successfully assigned 127 users to default tenant

Verification Summary:
  Total users: 145
  Users with tenant: 145
  Users without tenant: 0
✓ All users have been successfully assigned to a tenant

======================================================================
MIGRATION REPORT
======================================================================
Tenant ID: tenant_finbers
Total users processed: 145
Users without tenant (before): 127
Users successfully assigned: 127
Migration errors: 0
Status: ✓ SUCCESS
======================================================================
```

---

## ⏳ Remaining: Environment Configuration

### Required Environment Variables
```bash
# Default tenant configuration
NEXT_PUBLIC_DEFAULT_TENANT_SLUG=finbers-link

# Feature flags for default tenant
NEXT_PUBLIC_DEFAULT_TENANT_FEATURES=aiCourseQa,jobAutoSync
```

### Optional Environment Variables
```bash
# Superadmin impersonation (for testing)
NEXT_PUBLIC_DEMO_SUPERADMIN_ID=user_superadmin

# Multi-tenant routing
NEXT_PUBLIC_MULTI_TENANT_ENABLED=true
```

---

## ⏳ Remaining: API Route Tenant Filtering

API routes need to filter data by tenant. Pattern:

```typescript
// Example: Get tenant's courses
export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  const tenantId = requireTenant(session);  // Validates tenantId exists
  
  const courses = await prisma.course.findMany({
    where: { tenantId }  // ← Filter by tenant
  });
  
  return NextResponse.json(courses);
}
```

**Where to apply:**
1. Courses endpoints - filter by `tenantId`
2. Jobs endpoints - filter by `tenantId`
3. Users endpoints - filter by `tenantId`
4. Notifications endpoints - filter by `tenantId`
5. Forum/chat endpoints - filter by `tenantId`

**Guard functions already available:**
- `requireTenant(session, requiredTenantId?)` - Validate tenant in session
- `requireSuperAdmin(session)` - Validate SUPER_ADMIN role
- `requireAdminOrSuperAdmin(session)` - Validate admin roles

---

## ⏳ Remaining: Tenant-Aware Query Helpers

Create helper functions in `src/lib/tenant.ts`:

```typescript
/**
 * Get cursor query for tenant filter
 * Usage: where: getTenantWhere(tenantId)
 */
export function getTenantWhere(tenantId: string | null = null) {
  return tenantId ? { tenantId } : { tenantId: null };
}

/**
 * Create tenant-aware Prisma include
 */
export function getTenantIncludes(minimal = false) {
  return minimal 
    ? { tenant: { select: { id: true, name: true } } }
    : { tenant: true };
}

/**
 * Paginated list for tenant
 */
export async function listTenantResources(
  tenantId: string,
  model: any,
  skip: number,
  take: number,
  where?: any
) {
  return model.findMany({
    where: { tenantId, ...where },
    skip,
    take,
    orderBy: { createdAt: 'desc' }
  });
}
```

---

## ✅ Completed: Data Migrations

The following migrations have been applied:
- `20260303020730_add_tenant_models` - Created Tenant, TenantSettings, TenantUsage, TenantInvite
- `20260303024158_add_tenant_archive_flag` - Added archivedAt field to Tenant

To verify:
```bash
npx prisma migrate status
```

---

## 🔍 Verification Checklist

Before marking Task 18 complete, verify:

- [ ] Run migration: `npx prisma migrate dev`
- [ ] Run seed: `npx prisma db seed`
- [ ] Check database: All Tenant tables exist
- [ ] Verify schema: `npx prisma generate`
- [ ] Test registration: New users get assigned tenantId
- [ ] Test login: Session includes tenantId in JWT
- [ ] Run user migration: `npm exec ts-node scripts/migrate-users-to-default-tenant.ts`
- [ ] Verify all users have tenantId: Check database for null tenantId values (should be 0)

---

## 📋 Related Tasks

**Task 19** - Tenant Migration Script (this script)
**Task 20** - Middleware tenantId handling (completed)
**Task 21+** - Superadmin console features

---

## 🚀 Quick Start

1. **Initialize database:**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

2. **Migrate existing users:**
   ```bash
   npm exec ts-node scripts/migrate-users-to-default-tenant.ts
   ```

3. **Test in development:**
   ```bash
   npm run dev
   # Register new user -> should have tenantId
   # Login -> should see tenantId in session
   ```

4. **Monitor migration:**
   ```bash
   npx prisma studio
   # Check User table: all tenantId fields populated
   ```

---

## 🔐 Security Considerations

1. **Tenant Isolation:**
   - All queries MUST filter by `tenantId`
   - Middleware enforces tenant in session
   - SUPER_ADMIN role bypasses tenant checks (intentional)

2. **Data Boundaries:**
   - Users can only access their own tenant's data
   - Cross-tenant queries return 403 Forbidden
   - Audit log all tenant-level operations

3. **Seat Limits:**
   - Enforce `seatLimit` in user management
   - Track `seatAllocated` vs active users
   - Prevent overage without approval

---

## 📚 Related Files

- **Schema:** `prisma/schema.prisma`
- **Migrations:** `prisma/migrations/20260303*`
- **Seed Script:** `prisma/seed.ts`
- **Service Layer:** `src/features/superadmin/tenant-service.ts`
- **Default Tenant Service:** `src/features/tenant/service.ts`
- **Auth Guards:** `src/lib/auth/guards.ts` (includes `requireSuperAdmin`, `requireAdminOrSuperAdmin`)
- **Session Payload:** `src/lib/auth/jwt.ts`
- **Middleware:** `src/middleware.ts`
- **Migration Script:** `scripts/migrate-users-to-default-tenant.ts`

---

## 📞 Support & Questions

For questions about the multi-tenant architecture:
1. Check this document first
2. Review `docs/AUTHENTICATION.md` for session handling
3. Refer to `src/features/superadmin/tenant-service.ts` for service layer
4. Check test files for usage examples (if available)

