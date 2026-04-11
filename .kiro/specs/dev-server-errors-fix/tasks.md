# Dev Server Errors Fix - Tasks

## Phase 1: Routing Consolidation

- [x] 1.1 Consolidate resume API routes by merging [slug] into [resumeId]
  - [x] 1.1.1 Move src/app/api/resumes/[slug]/experience/ to src/app/api/resumes/[resumeId]/experience/
  - [x] 1.1.2 Move src/app/api/resumes/[slug]/export/ to src/app/api/resumes/[resumeId]/export/
  - [x] 1.1.3 Move src/app/api/resumes/[slug]/template/ to src/app/api/resumes/[resumeId]/template/
  - [x] 1.1.4 Move src/app/api/resumes/[slug]/update/ to src/app/api/resumes/[resumeId]/update/
  - [x] 1.1.5 Delete empty src/app/api/resumes/[slug]/ directory
  - [x] 1.1.6 Verify dev server starts without routing conflicts

## Phase 2: API Error Handling

- [x] 2.1 Fix error handling in src/app/api/dashboard/courses/discover/route.ts
  - [x] 2.1.1 Import AuthError from src/lib/auth/guards
  - [x] 2.1.2 Update catch block to check for AuthError and return correct status code
  - [x] 2.1.3 Verify endpoint returns 401 for missing/invalid auth

- [x] 2.2 Fix error handling in src/app/api/dashboard/courses/enrolled/route.ts
  - [x] 2.2.1 Import AuthError from src/lib/auth/guards
  - [x] 2.2.2 Update catch block to check for AuthError and return correct status code
  - [x] 2.2.3 Verify endpoint returns 401 for missing/invalid auth

- [x] 2.3 Fix error handling in src/app/api/dashboard/courses/assigned/route.ts
  - [x] 2.3.1 Import AuthError from src/lib/auth/guards
  - [x] 2.3.2 Update catch block to check for AuthError and return correct status code
  - [x] 2.3.3 Verify endpoint returns 401 for missing/invalid auth

## Phase 3: Middleware Verification

- [x] 3.1 Verify src/middleware.ts configuration
  - [x] 3.1.1 Check for legacy proxy middleware references
  - [x] 3.1.2 Verify middleware exports are correct
  - [x] 3.1.3 Remove any deprecated middleware patterns if found
  - [x] 3.1.4 Confirm middleware works correctly with fixed routes

## Phase 4: Testing and Validation

- [x] 4.1 Write exploratory tests to confirm bugs on unfixed code
  - [x] 4.1.1 Test routing conflict with both dynamic segments present
  - [x] 4.1.2 Test auth endpoints return 500 without authentication
  - [x] 4.1.3 Test middleware configuration for legacy references

- [x] 4.2 Write unit tests for fixes
  - [x] 4.2.1 Test dev server starts after route consolidation
  - [x] 4.2.2 Test discover endpoint returns 401 for missing auth
  - [x] 4.2.3 Test enrolled endpoint returns 401 for invalid auth
  - [x] 4.2.4 Test assigned endpoint returns 401 for missing auth
  - [x] 4.2.5 Test authenticated requests continue to work

- [x] 4.3 Write property-based tests for preservation
  - [x] 4.3.1 Property test: authenticated requests return 200 with correct data
  - [x] 4.3.2 Property test: non-auth errors continue to return 500
  - [x] 4.3.3 Property test: middleware allows authenticated users through

- [x] 4.4 Integration tests
  - [x] 4.4.1 Test full dev server startup with consolidated routes
  - [x] 4.4.2 Test complete authentication flow with course endpoints
  - [x] 4.4.3 Test middleware routing for authenticated and unauthenticated users
