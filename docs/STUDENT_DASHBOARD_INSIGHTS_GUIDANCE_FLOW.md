# Student Dashboard Insights & Guidance Flow

## Objective
Optimize the student Insights & Guidance experience for clarity, speed, and observability.

## Implemented Recommendations

### 1. Information architecture and navigation
- Removed Profile from public top navigation so unauthenticated users do not see it.
- Added Profile to authenticated student sidebar.
- Routed legacy profile page to dashboard profile route.
- Wired Insights & Guidance sidebar item to deep-link directly into the dashboard section anchor.

Primary files:
- src/config/site.ts
- src/app/dashboard/layout.tsx
- src/app/profile/page.tsx
- src/app/dashboard/sections-client.tsx

### 2. Real student profile surface in dashboard
- Added dedicated student profile page under dashboard.
- Switched from mock profile data to real Prisma-backed student data.
- Added profile tabs and real counters for resumes, applications, and enrollments.

Primary files:
- src/app/dashboard/profile/page.tsx
- src/app/dashboard/profile/profile-client.tsx

### 3. Insights & Guidance UI activation
- Promoted Insights & Guidance into a first-class rendered section in dashboard content.
- Added guidance hero, quick summary, highlights, recommendations, pipeline, and job focus cards.
- Added metrics grid with action links.

Primary file:
- src/app/dashboard/sections-client.tsx

### 4. Loading UX improvements
- Added dedicated Insights skeleton state.
- Preserved graceful empty/error/fallback states for all insight cards.

Primary file:
- src/app/dashboard/sections-client.tsx

### 5. Duplicate fetch elimination
- Refactored student dashboard to fetch sections once and pass payload to sections client.
- Reused same payload for top stat cards and section content.

Primary file:
- src/components/dashboard/student-dashboard.tsx

### 6. Fast first paint API mode
- Added mode support for dashboard sections endpoint: fast and full.
- In fast mode:
  - Reduced application and recommendation payload sizes.
  - Skipped savedIds payload.
  - Added timeout guards for non-critical calls.

Primary file:
- src/app/api/dashboard/sections/route.ts

### 7. Progressive hydration
- Implemented two-phase client fetch in student dashboard:
  1) fast response for first paint
  2) full response to enrich data after initial render

Primary file:
- src/components/dashboard/student-dashboard.tsx

### 8. Performance observability
- Added API response metadata with section timings and generation timestamp.
- Added dev diagnostics panel in Insights showing mode and per-section timings.
- Added timing severity badges (green/amber/red).
- Added automatic regression warning banner for threshold breaches.

Primary files:
- src/app/api/dashboard/sections/route.ts
- src/app/dashboard/sections-client.tsx

## Remaining Recommendations (Next Iteration)

### A. Full profile persistence
- Completed: Connected quick-edit controls to authenticated profile API.
- Completed: Persist headline, location, and bio into Profile model with upsert behavior.

Suggested files:
- src/app/dashboard/profile/profile-client.tsx
- src/app/dashboard/profile/page.tsx
- src/features/profile/service.ts
- src/app/api/profile/route.ts

### B. Cache and invalidation policy
- Completed: Added short-lived full-mode dashboard sections cache.
- Completed: Invalidate full-mode cache whenever dashboard insights are invalidated.
- Completed: Extended invalidation across student-impacting write paths (job apply, admin status updates, enrollment accept/decline, resume import, profile update).

Suggested files:
- src/app/api/dashboard/sections/route.ts
- src/features/dashboard/service.ts
- src/features/dashboard/sections-cache.ts

### C. Instrumentation hardening
- Completed: Added Server-Timing headers with per-section durations.
- Completed: Added structured timing summary logs and dev diagnostics visibility.

Suggested files:
- src/app/api/dashboard/sections/route.ts

### D. UX fine tuning
- Add subtle optimistic transitions when fast mode upgrades to full mode.
- Add concise copy for fallback guidance when data is partially unavailable.

Suggested file:
- src/app/dashboard/sections-client.tsx

## Suggested Acceptance Criteria
- Insights section appears and is reachable from sidebar anchor.
- First meaningful render uses fast mode and upgrades to full mode.
- Dev diagnostics displays timings and mode correctly in non-production.
- Regression warning appears when thresholds are exceeded.
- No Profile tab is visible to unauthenticated users in home nav.
- Student profile route resolves under dashboard and uses real user data.

## Notes
- Fast-mode payload trims non-essential work to improve perceived responsiveness.
- Full mode enriches data asynchronously to maintain completeness.
- Diagnostics are gated to non-production environment.
