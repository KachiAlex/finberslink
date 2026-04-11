# Bugfix Requirements Document: Dev Server Errors Fix

## Introduction

This bugfix addresses three critical dev server errors that prevent the application from running correctly:

1. **Routing Conflict**: Next.js routing error due to conflicting dynamic segment names in the same directory
2. **Incorrect HTTP Status Codes**: API endpoints returning 500 errors when they should return 401/403 for authentication failures
3. **Middleware Deprecation**: Verification and cleanup of any legacy middleware configuration

These issues block development and cause poor error handling in production scenarios.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the dev server starts with both `src/app/api/resumes/[resumeId]/` and `src/app/api/resumes/[slug]/` directories present THEN the server fails with error "You cannot use different slug names for the same dynamic path ('resumeId' !== 'slug')"

1.2 WHEN a request is made to `/api/dashboard/courses/discover` without valid authentication THEN the endpoint catches the AuthError and returns HTTP 500 instead of HTTP 401

1.3 WHEN a request is made to `/api/dashboard/courses/enrolled` without valid authentication THEN the endpoint catches the AuthError and returns HTTP 500 instead of HTTP 401

1.4 WHEN a request is made to `/api/dashboard/courses/assigned` without valid authentication THEN the endpoint catches the AuthError and returns HTTP 500 instead of HTTP 401

1.5 WHEN the middleware configuration is checked THEN legacy proxy middleware references may exist causing deprecation warnings

### Expected Behavior (Correct)

2.1 WHEN the dev server starts THEN it successfully initializes without routing conflicts, with only one dynamic segment name used for resume routes

2.2 WHEN a request is made to `/api/dashboard/courses/discover` without valid authentication THEN the endpoint returns HTTP 401 with appropriate error message

2.3 WHEN a request is made to `/api/dashboard/courses/enrolled` without valid authentication THEN the endpoint returns HTTP 401 with appropriate error message

2.4 WHEN a request is made to `/api/dashboard/courses/assigned` without valid authentication THEN the endpoint returns HTTP 401 with appropriate error message

2.5 WHEN the middleware configuration is checked THEN no legacy proxy middleware references exist and no deprecation warnings are generated

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a request is made to `/api/dashboard/courses/discover` with valid authentication THEN the endpoint SHALL CONTINUE TO return HTTP 200 with course discovery data

3.2 WHEN a request is made to `/api/dashboard/courses/enrolled` with valid authentication THEN the endpoint SHALL CONTINUE TO return HTTP 200 with enrolled courses data

3.3 WHEN a request is made to `/api/dashboard/courses/assigned` with valid authentication THEN the endpoint SHALL CONTINUE TO return HTTP 200 with assigned courses data

3.4 WHEN the middleware processes protected routes with valid authentication THEN it SHALL CONTINUE TO allow access and pass through to the route handler

3.5 WHEN the middleware processes public routes THEN it SHALL CONTINUE TO allow access without authentication
