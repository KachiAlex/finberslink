---
title: Finbers Link Architecture Overview
created: 2026-02-26
---

## 1. Vision & Pillars
Finbers Link is a skill-to-employment digital ecosystem that connects learning, profile building, and opportunity discovery. The platform integrates seven pillars:

1. Learning Management System (LMS)
2. AI-assisted resume builder
3. Jobs & volunteer marketplace
4. News & announcements module
5. Interactive forum + messaging
6. User profile & digital identity
7. RBAC-driven admin operations

## 2. High-level Architecture
```
+------------------------------+           +---------------------------+
| Next.js App Router frontend  |  HTTPS    |  Next.js API routes       |
| - Tailwind + shadcn          | <-------> |  Express-style handlers   |
| - Client/server components   |           |  (app/api/*)              |
+---------------+--------------+           +---------------+-----------+
                |                                          |
                |                                          |
          WebSockets (Socket.IO)                     Prisma ORM
                |                                          |
                v                                          v
        Real-time Gateway (app/api/socket)         PostgreSQL (RDS/Aurora)

                ^                                          ^
                |                                          |
           Uploads via S3 SDK <----------------------+  Storage (S3-compatible)
```

Support services:
- Background workers via Next.js Route Handlers + queues (BullMQ/Redis-ready hook) for certificate generation, notifications, and AI tasks.
- AI service layer wrapping OpenAI for resume optimization.
- Shared `lib` utilities for security (JWT, bcrypt, Zod validation, CSRF, rate limiting) and RBAC policies.

## 3. Module Breakdown
### 3.1 Authentication & RBAC
- JWT access + refresh tokens stored in httpOnly cookies.
- `middleware.ts` enforces auth/role gating on `/dashboard`, `/admin`, `/api/secure/*`.
- `lib/auth.ts` handles hashing, verification, token rotation.
- RBAC matrix in `lib/rbac.ts` mapping roles (Super Admin, Admin, Tutor, Student, Employer) to privileges.

### 3.2 LMS Service
- Pages: `/courses`, `/courses/[id]`, `/dashboard/courses/[courseId]/lessons/[lessonId]`.
- Server actions perform enroll, progress updates, certificate issuance.
- Forum per lesson implemented via `/api/forum` endpoints + Socket.io room.
- Gamification badges stored in `UserBadges` (derived table) and surfaced on dashboard sidebar.

### 3.3 AI Resume Builder
- Multi-step wizard under `/resume/builder` (App Router client components per step, persisted draft via optimistic mutations).
- AI endpoints `/api/ai/resume/*` calling OpenAI with role-specific prompts.
- Public resume slug page `/profile/[slug]` server-rendered for SEO < 3s with incremental static regeneration + hydration for contact actions.

### 3.4 Opportunity Marketplace
- Jobs: `/jobs`, `/jobs/[id]`, filters handled server-side with search params + Prisma full-text indexes.
- Volunteer: `/volunteer`, `/volunteer/[id]`, admin creation via `/admin/opportunities`.
- Applications tracked via `/dashboard/applications` with statuses.

### 3.5 News Module
- `/news` feed with pagination, card layout.
- `/news/[id]` article + optional comment thread.
- Admin composer inside `/admin/news` with markdown editor.

### 3.6 Messaging & Forum
- Socket.io namespace `/chat` for direct messages.
- `/forum/[lessonId]` surfaces posts + replies with optimistic updates.
- Notifications service emits WebSocket events + persists to DB.

### 3.7 Admin Console
- `/admin` layout with tabs: Users, Tutors, Categories, Jobs, Volunteer, News, Analytics, Forums.
- Guarded by `withRole(['ADMIN','SUPER_ADMIN'])` middleware.

## 4. Data Design
- Normalized PostgreSQL schema defined in `prisma/schema.prisma` covering entities in the spec plus linking tables (Categories, Badges, Notifications, etc.).
- Indexed columns: `Users.email`, `Courses.categoryId`, `Enrollments.userId/courseId`, `ForumPosts.lessonId`, `Jobs.country/salaryRange/experienceLevel`, `ResumeProfiles.resumeSlug` (unique), `Messages.senderId/receiverId` composite, `Notifications.userId/readStatus`.

## 5. Security & Compliance
- Input validation: route handlers import Zod schemas from `lib/validation/*`.
- Rate limiting: `lib/rate-limit.ts` (Upstash Redis ready) wraps API routes.
- CSRF: synchronizer token stored in encrypted cookie + validated header.
- File uploads: server-side type/size validation before S3 put, signed URLs expire in 10 minutes.
- Secrets handled via `.env` + `env.mjs` runtime validator.

## 6. Performance Strategy
- Server components for data fetching heavy pages, lighten client JS.
- Streaming/resumable video player with dynamic import.
- Pagination + infinite scroll where appropriate.
- Use ISR on public pages (news, resume) with revalidate tags.

## 7. Deployment & DevOps
- Dockerfile multi-stage build (builder + runtime) with Next.js standalone output.
- docker-compose defines `web`, `postgres`, `minio` (S3 compatible), `redis` (for socket adapter/rate limits).
- Prisma migrations run via `prisma migrate deploy` entrypoint.
- Seed script populates roles, sample users, courses, jobs, volunteer, news.
- CI workflow (GitHub Actions ready) to lint/test/build, run prisma checks, and publish image.

## 8. Directory Layout
```
/app                # App Router routes grouped by domain
/components         # UI + shadcn wrappers
/lib                # utilities (auth, db, validation, ai, storage)
/services           # business logic modules (courses, resume, jobs, etc.)
/prisma             # schema, migrations, seeds
/middleware.ts      # auth & security middleware
/types              # global TypeScript types, enums
/config             # constants (roles, limits, aws)
```

## 9. Next Steps
1. Scaffold Next.js (TS, Tailwind, shadcn) + configure absolute imports.
2. Define Prisma schema + env typing + migration.
3. Implement auth (register/login, JWT, middleware) + RBAC utilities.
4. Build API/services per module.
5. Implement frontend pages + components.
6. Add AI + storage + realtime integrations.
7. Finalize Docker/deployment + documentation.

### Detailed Milestones

**Backend foundation (highest priority)**
- Define Prisma schema for all domain entities in `/prisma/schema.prisma`, run initial migration, and provide seed script with representative data.
- Implement authentication services (registration, login, JWT issue/refresh) plus RBAC middleware shared via `/lib` and `/middleware`.
- Stand up API route handlers (App Router) covering courses, lessons/forum, resume, jobs, volunteer, news, and notifications.

**Dashboard & role shell**
- Build `/dashboard` layout with top nav + sidebar derived from `siteConfig.dashboardNav`, showing cards for enrolled courses, resume completion, application status, and badges.
- Add server actions that update enrollment progress and fetch notifications per role.

**LMS vertical**
- Ship `/courses`, `/courses/[id]`, `/courses/[id]/lessons/[lessonId]` pages.
- Create components for lesson video player, resources list, progress indicators, and certificate CTAs.
- Deliver forum UI per lesson plus live replies powered by Socket.io.

**AI resume builder flow**
- Multi-step wizard at `/resume/builder` covering all specified steps.
- Hook `/lib/ai/resume.ts` into OpenAI for summary rewrites, ATS keywords, and bullet improvements.
- Publish resume detail page `/profile/[slug]` with PDF download + video embed.

**Opportunity modules**
- `/jobs` listing with filters (country, remote/onsite, salary, experience) plus detail/apply modal tied to resume data.
- `/volunteer` listing plus admin CRUD experiences.
- Application tracking dashboard located at `/dashboard/applications`.

**News & communications**
- `/news` feed + detail page, optional comments.
- Admin composer (rich text/markdown) under `/admin/news`.
- Notifications panel + bell component wired to DB + WebSocket events.

**Admin console**
- `/admin` tabs: users, tutor approvals, categories, jobs, volunteer, news, analytics, forum moderation.
- Ensure role guards restrict access to Admin/Super Admin roles only.

**Infrastructure & polish**
- File upload service using AWS S3 compatible storage for videos/portfolio files.
- Rate limiting, CSRF protection, Zod input validation, Dockerfile + docker-compose, and environment docs.
- Comprehensive seed data + README instructions.
