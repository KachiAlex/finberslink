# Dashboard UI Refinement Plan

## Terminology & Copy Consistency
- [ ] Inventory confusing labels per role (courses/cohorts, forums/chats, etc.)
- [ ] Draft role-based copy guide (button verbs, sentence case, tone)
- [ ] Apply updated copy to dashboard CTAs, badges, and helper text

## Layout & Hierarchy System
- [ ] Define shared dashboard spacing/grid tokens (card padding, gap scale, breakpoints)
- [ ] Create reusable `DashboardHero` and `SectionCard` components
- [ ] Refactor each dashboard (student, tutor, employer, admin) to the shared components

## Action Consolidation
- [ ] Map redundant buttons/links and decide a single primary action per card
- [ ] Convert secondary links inside cards to subtle text links or menu items
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
