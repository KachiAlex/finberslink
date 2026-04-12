# Build Errors (594 instances) - Bugfix Specification

## Bug Condition

The Next.js build process encounters 594 import resolution and component errors across the codebase:

1. **React Server Component Issues** (1 error)
   - Missing "use client" directive in components using React hooks

2. **Hook Import Errors** (1 error)
   - useSocket hook not properly exported/imported

3. **UI Component Import Errors** (45+ errors)
   - button, badge, card, input, textarea, progress, stat-card, glass-card, toaster, tabs

4. **Feature Service Import Errors** (200+ errors)
   - Resume services (service, schemas, ai-service, export-service, analytics-service, notification-service)
   - Other feature services across multiple features

5. **App Page Import Errors** (50+ errors)
   - Page-to-page imports failing

6. **Component Import Errors** (100+ errors)
   - Layout components, feature components

7. **Core Library Import Errors** (150+ errors)
   - Authentication (session, jwt, guards)
   - Database (prisma)
   - Security (rate-limit)

8. **Configuration Import Errors** (10+ errors)
   - site configuration, dashboard-courses-url

## Root Cause Analysis

The errors indicate:
1. Missing "use client" directives in client components
2. Incomplete or missing exports from service files
3. Circular dependencies or missing re-exports
4. Components using hooks without proper client-side marking

## Expected Behavior

After fixes:
- All 594 errors resolved
- Build completes successfully
- All imports resolve correctly
- All components properly marked as client/server
- All services properly exported

## Fix Strategy

**Priority 1: Core Libraries**
- Fix all @/lib/prisma imports
- Fix all @/lib/auth imports
- Fix all @/lib/security imports

**Priority 2: UI Components**
- Fix all @/components/ui imports
- Add "use client" directives where needed

**Priority 3: Feature Services**
- Fix all @/features/*/service imports
- Fix all @/features/*/schemas imports

**Priority 4: Components**
- Fix all layout component imports
- Fix all feature component imports

**Priority 5: Pages**
- Fix all app page imports
- Fix all configuration imports
