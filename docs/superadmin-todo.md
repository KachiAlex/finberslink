# Superadmin Program TODO

## Phase 1 – Foundational work
- [x] Extend Prisma schema for tenants (Tenant, TenantSettings, TenantUsage) and link existing entities via `tenantId`
- [x] Seed default "Finbers Link" tenant and migration script for existing users/data
- [x] Update session payload + middleware to carry `tenantId`
- [ ] Restrict public registration roles (default STUDENT, optional tutor/employer via tenant setting)

## Phase 2 – Superadmin application shell
- [ ] Create `/superadmin` route group with dedicated layout, nav, and auth guard (SUPER_ADMIN only)
- [ ] Build overview page with key KPIs (tenants live, seats used, license status, alerts)
- [ ] Implement reusable UI primitives (TenantHealthBadge, LicenseMeter, InlineChartTile)

## Phase 3 – Tenant management
- [ ] Tenants directory page (list, filters, quick actions)
- [ ] Tenant detail view with tabs: Summary, Usage, Billing, Members, Settings
- [ ] License editor (tier picker, seat allocation, renewal controls)

## Phase 4 – Billing & automations
- [ ] Integrate billing provider (Stripe or manual invoicing) for tenant plans
- [ ] Feature flag management per tenant (toggle modules)
- [ ] Automation hooks (renewal reminders, overage alerts, onboarding checklists)

## Phase 5 – Rollout & documentation
- [ ] Update onboarding docs + internal playbooks
- [ ] QA pass for access control + multi-tenant data boundaries
- [ ] Deployment checklist + monitoring dashboards

---

## Immediate follow-ups (in progress)
- [x] Create migration script to assign existing users to default tenant: `scripts/migrate-users-to-default-tenant.ts`
- [x] Document multi-tenant setup in `docs/MULTI_TENANT_SETUP.md`
- [x] Add npm script: `npm run migrate:users-to-tenant`
- [ ] Refresh Prisma-generated types in your editor (rerun `npx prisma generate` + restart TS server) so new Tenant models resolve in TypeScript.
- [ ] Run `prisma/seed.ts` (now tenant-aware) to create the default Finbers tenant plus SUPER_ADMIN demo accounts.
- [ ] Run migration script: `npm run migrate:users-to-tenant` to assign existing users to default tenant.
- [ ] Add `NEXT_PUBLIC_DEMO_SUPERADMIN_ID` env var (matching seeded superadmin ID) for local impersonation.
- [ ] Use `npm run ts-node scripts/create-superadmin.ts --email <email> --password <password>` to provision extra superadmins as needed (script handles tenant slug + hashing).
- [ ] Flesh out `/superadmin/tenants`, `/superadmin/usage`, `/superadmin/billing` pages:
  - Tenants list with filters + quick actions (impersonate, suspend, upgrade, feature toggles).
  - Tenant detail tabs (Summary, Usage, Billing, Members, Settings).
  - Usage dashboards pulling from `TenantUsage` metrics.
- [ ] Implement superadmin tenant lifecycle controls: create tenant, update license seat limits/tier/expiry, suspend/activate, archive, and regenerate tenant admin access (invites/resets) with audit logging.
- [ ] Connect feature flag toggles to `TenantSettings.featureFlags` (persist changes + surface in admin interface).
- [ ] Implement automation hooks: renewal reminders, overage alerts, onboarding checklists (triggered via cron/queue).
- [ ] Harden middleware to handle tenant-aware redirects for mixed-role accounts (e.g., ADMIN vs SUPER_ADMIN).
- [ ] Write runbook covering multi-tenant migrations, seeding, and rollback strategy.
