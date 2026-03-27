# Finbers Link Delivery Checklist

## Backend foundation
- [x] Define Prisma schema, run initial migration, and create seed script
- [ ] Replace LMS mock data with Prisma queries + server helpers
- [ ] Implement auth service (register/login, JWT refresh) and RBAC middleware
- [ ] Build API route handlers for courses, lessons/forum, resume, jobs, volunteer, news, notifications

## Dashboard & role shell
- [ ] Create `/dashboard` layout with top nav + sidebar using `siteConfig.dashboardNav`
- [ ] Add role cards for courses, resume, applications, badges
- [ ] Wire server actions for enrollment progress + notification fetch

## LMS vertical
- [x] Build `/courses`, `/courses/[id]`, `/courses/[id]/lessons/[lessonId]`
- [x] Implement lesson player, resources list, progress indicators, certificate CTA
- [ ] Wire LMS pages to Prisma data + enrollment progress state
- [ ] Add forum UI with live replies via Socket.io

## AI resume builder flow
- [ ] Ship `/resume/builder` wizard with all steps
- [ ] Integrate `/lib/ai/resume.ts` with OpenAI helpers (summary, ATS, bullets)
- [ ] Publish `/profile/[slug]` resume page with PDF + video embed

## Opportunity modules
- [ ] Create `/jobs` listing with filters + detail/apply modal tied to resume
- [ ] Build `/volunteer` listing and admin CRUD interfaces
- [ ] Implement `/dashboard/applications` tracking view

## News & communications
- [ ] Launch `/news` feed + detail pages with optional comments
- [ ] Build `/admin/news` composer (rich text/markdown)
- [ ] Add notifications bell/panel backed by DB + WebSockets

## Admin console
- [ ] Deliver `/admin` tabs for users, tutor approvals, categories, jobs, volunteer, news, analytics, forum moderation
- [ ] Enforce Admin/Super Admin guards across routes

## Infrastructure & polish
- [ ] File upload service backed by AWS S3-compatible storage
- [ ] Add rate limiting, CSRF protection, and Zod validation helpers
- [ ] Provide Dockerfile + docker-compose + environment docs + rich seed data

## Course creation and assignment rollout (Mar 2026)
- [x] Keep lesson videos embed-only (remove direct video upload button)
- [x] Auto-attach uploaded lesson resources immediately after file selection
- [x] Reuse one course-creation wizard UI for tutor and admin
- [x] Admin create flow skips review and publishes immediately
- [x] Preserve tutor submit-to-review flow while admin publishes directly
- [x] Add per-student course assignment controls in admin students roster
- [x] Add bulk course assignment for selected students
- [x] Show assignment success/error feedback on admin students page
- [x] Disable already-assigned courses in per-student assign dropdown
- [x] Add Select all / Clear all controls for bulk student picker
- [x] Add search by student name/email in bulk student picker
- [x] Add Show only selected toggle in bulk student picker
- [x] Add selected-students preview summary in bulk student picker
- [x] Add assignment audit table (who assigned, when, status transitions)
- [x] Add idempotent assignment notifications (prevent duplicate alerts)
