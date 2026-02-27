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
