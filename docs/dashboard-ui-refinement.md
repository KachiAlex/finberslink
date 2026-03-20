# Dashboard UI Refinement Plan

## Terminology & Copy Consistency
- [x] Inventory confusing labels per role (courses/cohorts, forums/chats, etc.)
- [x] Draft role-based copy guide (button verbs, sentence case, tone)
- [x] Apply updated copy to dashboard CTAs, badges, and helper text

### Copy Guide Snapshot
- **Student**: speak in clear next-step verbs ("Continue learning", "Review applications"), avoid jargon like "mission control".
- **Tutor**: highlight coaching impact and admin obligations ("Manage courses", "Check analytics") rather than poetic language.
- **Employer**: emphasize pipeline clarity ("Post a role", "Review candidates") and avoid duplicate job-post buttons.
- **Admin**: use operations language ("Open control panel", "Review usage") and keep actions singular per card.
- Buttons follow `{verb} {object}` sentence case, helper text stays under 110 characters, and only one primary action per surface.

## Layout & Hierarchy System
- [ ] Define shared dashboard spacing/grid tokens (card padding, gap scale, breakpoints)
- [ ] Create reusable `DashboardHero` and `SectionCard` components
- [ ] Refactor each dashboard (student, tutor, employer, admin) to the shared components

## Action Consolidation
- [x] Map redundant buttons/links and decide a single primary action per card
- [x] Convert secondary links inside cards to subtle text links or menu items
- [ ] Add quick filters/tabs where multiple buttons previously duplicated destinations
- [x] Pilot button consolidation pattern on Admin jobs + forums cards

## Navigation & Guidance
- [ ] Introduce top-of-dashboard action strip per persona highlighting 1-2 next steps
- [ ] Add contextual helper text/tooltips for actions that need extra guidance
- [ ] Audit global nav vs dashboard links to avoid duplication

## Visual Language & Feedback
- [ ] Standardize badge colors for statuses (approval, alerts, info)
- [ ] Limit attention colors to focus/alert states; demote neutral info to muted palette
- [ ] Add lightweight empty-state illustrations or guidance blocks per role

## Implementation Rollout
1. Terminology audit + copy guide
2. Build shared layout primitives
3. Apply to admin dashboard (pilot)
4. Roll changes to tutor, student, employer dashboards
5. QA accessibility & responsiveness across breakpoints
