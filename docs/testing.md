# Testing Guide

## End-to-end (Playwright)

### Setup
1. Install dependencies: `npm install`
2. Install browsers: `npx playwright install`
3. Seed student/demo data: `npx tsx scripts/seed-student-dashboard-fixture.ts`

> The fixture script creates/updates `student@finberslink.com` with password `student123!` (override via env vars `E2E_STUDENT_EMAIL`, `E2E_STUDENT_PASSWORD`). It also ensures the `product-strategy-lab` course, lessons, resources, and enrollment exist.

### Running

Start the Next.js dev server (Playwright config auto-starts via `webServer`, but you can also run `npm run dev` manually) and execute:

```bash
npm run test:e2e
```

### Flow Covered
- Student logs in via `/login`
- Dashboard renders active course card
- Navigates to `/courses/[courseId]`
- Opens first lesson `/courses/[courseId]/lessons/[lessonId]`

Tests live under `tests/e2e/*.spec.ts`.
