# Dev Server Errors Fix - Design Document

## Overview

This design addresses three critical dev server errors that prevent the application from running correctly:

1. **Routing Conflict**: Next.js routing error due to conflicting dynamic segment names (`[resumeId]` vs `[slug]`) in the same directory
2. **Incorrect HTTP Status Codes**: API endpoints returning 500 errors when they should return 401/403 for authentication failures
3. **Middleware Verification**: Ensure middleware configuration is correct and no legacy references exist

The fix strategy is to consolidate conflicting routes, properly handle AuthError exceptions in API endpoints, and verify middleware configuration.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - either conflicting route segments, unhandled AuthError exceptions, or legacy middleware configuration
- **Property (P)**: The desired behavior when the bug condition is present - proper routing, correct HTTP status codes, clean middleware
- **Preservation**: Existing functionality that must remain unchanged - authenticated requests continue to work, public routes remain accessible
- **AuthError**: Custom error class in `src/lib/auth/guards.ts` that includes a `status` property for HTTP status codes
- **Dynamic Segment**: Next.js route parameter syntax using square brackets (e.g., `[resumeId]`)
- **Route Consolidation**: Merging two dynamic segment directories into one with a unified naming convention

## Bug Details

### Bug Condition

The bug manifests in three distinct scenarios:

1. **Routing Conflict**: When the dev server starts with both `src/app/api/resumes/[resumeId]/` and `src/app/api/resumes/[slug]/` directories present, Next.js cannot determine which dynamic segment to use and throws an error: "You cannot use different slug names for the same dynamic path ('resumeId' !== 'slug')"

2. **Auth Error Handling**: When a request is made to `/api/dashboard/courses/discover`, `/api/dashboard/courses/enrolled`, or `/api/dashboard/courses/assigned` without valid authentication, the `requireAuth()` function throws an `AuthError` with a `status` property (401 or 403), but the catch block returns HTTP 500 instead of using the error's status code.

3. **Middleware Configuration**: Legacy middleware references or deprecated proxy middleware configuration may exist in `src/middleware.ts`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type {type: string, context: any}
  OUTPUT: boolean
  
  RETURN (input.type = "routing" AND [resumeId] AND [slug] both exist)
         OR (input.type = "auth" AND AuthError thrown AND catch block returns 500)
         OR (input.type = "middleware" AND legacy references exist)
END FUNCTION
```

### Examples

**Example 1 - Routing Conflict:**
- Current state: Both `src/app/api/resumes/[resumeId]/` and `src/app/api/resumes/[slug]/` directories exist
- Expected: Only one dynamic segment directory exists with unified naming
- Actual: Dev server fails to start with routing conflict error

**Example 2 - Auth Error Handling (discover endpoint):**
- Current state: Request to `/api/dashboard/courses/discover` without auth token
- Expected: HTTP 401 response with "No access token provided" message
- Actual: HTTP 500 response with "Failed to fetch courses" message

**Example 3 - Auth Error Handling (enrolled endpoint):**
- Current state: Request to `/api/dashboard/courses/enrolled` with invalid token
- Expected: HTTP 401 response with "Invalid or expired access token" message
- Actual: HTTP 500 response with "Failed to fetch enrolled courses" message

**Example 4 - Auth Error Handling (assigned endpoint):**
- Current state: Request to `/api/dashboard/courses/assigned` with expired token
- Expected: HTTP 401 response with appropriate error message
- Actual: HTTP 500 response with "Failed to fetch assigned courses" message

**Example 5 - Edge Case (Middleware):**
- Current state: Middleware configuration checked for legacy references
- Expected: No deprecated proxy middleware or legacy configuration
- Actual: May contain outdated references

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authenticated requests to `/api/dashboard/courses/discover` continue to return HTTP 200 with course discovery data
- Authenticated requests to `/api/dashboard/courses/enrolled` continue to return HTTP 200 with enrolled courses data
- Authenticated requests to `/api/dashboard/courses/assigned` continue to return HTTP 200 with assigned courses data
- Middleware continues to protect routes and allow authenticated users through
- Public routes (like resume sharing) continue to be accessible without authentication
- Mouse clicks and other non-auth interactions continue to work as before

**Scope:**
All requests that DO NOT involve authentication failures should be completely unaffected by this fix. This includes:
- Authenticated API requests with valid tokens
- Public route access
- Middleware routing for authenticated users
- Resume API endpoints with valid authentication

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Conflicting Dynamic Segments**: The `[resumeId]` and `[slug]` directories were created at different times for different purposes, but Next.js requires a single dynamic segment name per directory level. The `[slug]` directory appears to be for public resume viewing, while `[resumeId]` is for authenticated operations.

2. **Incomplete Error Handling**: The three course endpoints (`discover`, `enrolled`, `assigned`) use generic catch blocks that return HTTP 500 for all errors. They don't check if the caught error is an `AuthError` and extract its `status` property.

3. **Missing Error Type Checking**: The catch blocks don't differentiate between authentication errors (which should return 401/403) and other errors (which should return 500).

4. **Middleware Configuration**: The middleware may contain legacy references or deprecated proxy configuration that should be cleaned up.

## Correctness Properties

Property 1: Bug Condition - Routing Consolidation

_For any_ dev server startup where both `[resumeId]` and `[slug]` dynamic segment directories exist in `src/app/api/resumes/`, the fixed application SHALL consolidate these into a single dynamic segment directory with a unified naming convention, allowing the dev server to start without routing conflicts.

**Validates: Requirements 2.1**

Property 2: Bug Condition - Auth Error Status Codes

_For any_ request to `/api/dashboard/courses/discover`, `/api/dashboard/courses/enrolled`, or `/api/dashboard/courses/assigned` where authentication fails (no token, invalid token, or insufficient permissions), the fixed endpoints SHALL catch the `AuthError` exception and return the HTTP status code specified in the error's `status` property (401 or 403) instead of 500.

**Validates: Requirements 2.2, 2.3, 2.4**

Property 3: Preservation - Authenticated Requests

_For any_ request to `/api/dashboard/courses/discover`, `/api/dashboard/courses/enrolled`, or `/api/dashboard/courses/assigned` with valid authentication, the fixed endpoints SHALL produce the same result as the original code, returning HTTP 200 with the appropriate course data.

**Validates: Requirements 3.1, 3.2, 3.3**

Property 4: Preservation - Middleware Behavior

_For any_ request to protected routes with valid authentication, the fixed middleware SHALL continue to allow access and pass through to the route handler, preserving all existing authentication behavior.

**Validates: Requirements 3.4**

Property 5: Preservation - Public Routes

_For any_ request to public routes (like resume sharing), the fixed middleware SHALL continue to allow access without authentication, preserving public route accessibility.

**Validates: Requirements 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `src/app/api/resumes/` - Consolidate dynamic segments

**Action**: Choose `[resumeId]` as the canonical naming convention and migrate all routes from `[slug]` to `[resumeId]`

**Specific Changes**:
1. **Merge Subdirectories**: Move all subdirectories from `src/app/api/resumes/[slug]/` into `src/app/api/resumes/[resumeId]/`
   - Move `[slug]/experience/` → `[resumeId]/experience/`
   - Move `[slug]/export/` → `[resumeId]/export/`
   - Move `[slug]/template/` → `[resumeId]/template/`
   - Move `[slug]/update/` → `[resumeId]/update/`

2. **Delete Legacy Directory**: Remove the empty `src/app/api/resumes/[slug]/` directory

3. **Update Route References**: If any route files reference the old path, update them to use the new consolidated path

**File 2**: `src/app/api/dashboard/courses/discover/route.ts` - Fix error handling

**Specific Changes**:
1. **Import AuthError**: Ensure `AuthError` is imported from `src/lib/auth/guards`
2. **Update Catch Block**: Replace generic catch block with error type checking:
   ```typescript
   catch (error) {
     if (error instanceof AuthError) {
       return NextResponse.json({ error: error.message }, { status: error.status });
     }
     console.error("Error fetching discover courses:", error);
     return NextResponse.json(
       { error: "Failed to fetch courses" },
       { status: 500 }
     );
   }
   ```

**File 3**: `src/app/api/dashboard/courses/enrolled/route.ts` - Fix error handling

**Specific Changes**:
1. **Import AuthError**: Ensure `AuthError` is imported from `src/lib/auth/guards`
2. **Update Catch Block**: Replace generic catch block with error type checking:
   ```typescript
   catch (error) {
     if (error instanceof AuthError) {
       return NextResponse.json({ error: error.message }, { status: error.status });
     }
     console.error("Error fetching enrolled courses:", error);
     return NextResponse.json(
       { error: "Failed to fetch enrolled courses" },
       { status: 500 }
     );
   }
   ```

**File 4**: `src/app/api/dashboard/courses/assigned/route.ts` - Fix error handling

**Specific Changes**:
1. **Import AuthError**: Ensure `AuthError` is imported from `src/lib/auth/guards`
2. **Update Catch Block**: Replace generic catch block with error type checking:
   ```typescript
   catch (error) {
     if (error instanceof AuthError) {
       return NextResponse.json({ error: error.message }, { status: error.status });
     }
     console.error("Error fetching assigned courses:", error);
     return NextResponse.json(
       { error: "Failed to fetch assigned courses" },
       { status: 500 }
     );
   }
   ```

**File 5**: `src/middleware.ts` - Verify and clean up

**Specific Changes**:
1. **Verify Configuration**: Ensure no legacy proxy middleware references exist
2. **Verify Exports**: Ensure the middleware exports are correct (no deprecated patterns)
3. **Remove Legacy Code**: If any deprecated middleware patterns are found, remove them

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fixes. Confirm or refute the root cause analysis.

**Test Plan**: 
1. Attempt to start the dev server with both `[resumeId]` and `[slug]` directories present and observe the routing conflict error
2. Make requests to the three course endpoints without authentication and observe HTTP 500 responses
3. Check middleware configuration for legacy references

**Test Cases**:
1. **Routing Conflict Test**: Start dev server with both dynamic segment directories (will fail on unfixed code)
2. **Auth Error - No Token Test**: Request `/api/dashboard/courses/discover` without auth token (will return 500 on unfixed code)
3. **Auth Error - Invalid Token Test**: Request `/api/dashboard/courses/enrolled` with invalid token (will return 500 on unfixed code)
4. **Auth Error - Expired Token Test**: Request `/api/dashboard/courses/assigned` with expired token (will return 500 on unfixed code)
5. **Middleware Configuration Test**: Verify middleware.ts for legacy references (may find issues on unfixed code)

**Expected Counterexamples**:
- Dev server fails to start with "You cannot use different slug names for the same dynamic path" error
- Auth endpoints return HTTP 500 instead of 401/403
- Middleware may contain deprecated proxy references

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  IF input.type = "routing" THEN
    result := devServerStart()
    ASSERT result.success = true
    ASSERT result.routingConflict = false
  ELSE IF input.type = "auth" THEN
    result := apiEndpoint(input.request)
    ASSERT result.status IN [401, 403]
    ASSERT result.body.error is not empty
  ELSE IF input.type = "middleware" THEN
    result := checkMiddlewareConfig()
    ASSERT result.legacyReferences = false
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalCode(input) = fixedCode(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for authenticated requests

**Test Plan**: 
1. Observe behavior on UNFIXED code for authenticated requests
2. Write property-based tests capturing that behavior
3. Verify fixed code produces identical results

**Test Cases**:
1. **Authenticated Discover Test**: Verify authenticated requests to `/api/dashboard/courses/discover` continue to return HTTP 200 with course data
2. **Authenticated Enrolled Test**: Verify authenticated requests to `/api/dashboard/courses/enrolled` continue to return HTTP 200 with enrolled courses
3. **Authenticated Assigned Test**: Verify authenticated requests to `/api/dashboard/courses/assigned` continue to return HTTP 200 with assigned courses
4. **Middleware Authenticated Test**: Verify middleware continues to allow authenticated users through to protected routes
5. **Public Route Test**: Verify public routes (like resume sharing) continue to be accessible without authentication

### Unit Tests

- Test that dev server starts successfully after consolidating resume routes
- Test that `/api/dashboard/courses/discover` returns 401 when no auth token is provided
- Test that `/api/dashboard/courses/enrolled` returns 401 when auth token is invalid
- Test that `/api/dashboard/courses/assigned` returns 403 when user lacks permissions
- Test that authenticated requests continue to return 200 with correct data
- Test that middleware configuration contains no legacy references

### Property-Based Tests

- Generate random authentication scenarios and verify correct status codes are returned
- Generate random authenticated requests and verify they continue to work correctly
- Generate random middleware configurations and verify no legacy patterns exist
- Test that all non-auth errors continue to return 500

### Integration Tests

- Test full dev server startup with consolidated routes
- Test complete authentication flow with course endpoints
- Test middleware routing for authenticated and unauthenticated users
- Test that resume API endpoints work correctly after consolidation
