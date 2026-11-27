# #25: Admin lists: users and notifications

- **State:** closed, closed 2026-11-27 19:50 UTC
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/ai-task/issues/25

## Body

## Parent

#4

## What to build

Admins see every user with role, sign-up date and alert count, and every notification with owner, destination type, status, attempts and reason, filterable by status. Stories 49, 52. Design: `docs/design/screens/admin-lists.md`.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] Users: email, role, sign-up date, number of alerts; 25 per page, newest first
- [ ] Notifications: event, owner's email, destination type, status, attempts, failure or skip reason; 25 per page, newest first
- [ ] The status filter (All, Pending, Sent, Failed, Skipped) lives in `?status=`; an unknown value shows All; the pager keeps the filter
- [ ] Empty, loading and error states as designed
- [ ] A non-admin gets the not-found page; Playwright specs on both projects



## Contracts already in place

- `/admin/users` and `/admin/notifications` are placeholders rendering `AdminFrame` after `requireAdmin()`; keep that order.
- **Users:** `rpc("admin_users", { p_limit: 25, p_offset })` returns `user_id, email, role, created_at, alert_count, total_count` (total for the pager), newest first.
- **Notifications:** `rpc("admin_notifications", { p_status, p_limit: 25, p_offset })` with `p_status` null for All, returns `id, status, channel_type, attempts, last_error, skip_reason, sent_at, next_attempt_at, created_at, event_title, event_occurred_at, event_simulated, owner_email, total_count`, newest first.
- The status filter is `FilterLinks` (`src/components/filter-links.tsx`) on `?status=`; an unknown value is All. Pager: `src/components/pager.tsx`. Status: `NotificationStatus`; badge: `SimulatedBadge`.
- Both functions return nothing for a non-admin.

## Owned paths

- `src/features/admin/users/**` (new), `src/features/admin/notifications/**` (new)
- `src/app/(app)/admin/users/**`, `src/app/(app)/admin/notifications/**`
- `e2e/admin-lists.spec.ts` (new)

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. Pending buttons keep focus (`aria-disabled`, not `disabled`; increment 1 UX review, item 5). End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, delete it with `deleteUser()`, and never write through the demo accounts. The local database is shared: assert only on your own rows. Remove your page's "Not built yet." placeholder. Do not add migrations, dependencies, shadcn components, or edit `src/components/ui/` or `globals.css`: report a missing contract instead.

**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in.

## Comments

### keserukristof, 2026-11-27 19:50 UTC

Merged into increment-2 in f7db256; the status cast removed in cc2effe by making the function's parameters optional.

