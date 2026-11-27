# #12: Notification history

- **State:** closed, closed 2026-11-27 18:05 UTC
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/12

## Body

## Parent

#3

## What to build

A user sees their notification history, newest first, 25 a page: the event with its time, the alert or "Deleted alert", the destination, the severity, and the status with its reason. Simulated events carry the Simulated badge.

Stories 37, 39 and 40 of #3. Screen: `docs/design/screens/notifications.md`.

## Acceptance criteria

- [ ] Everything under "History (37)", "Limits (38, 39)" display and "Empty state (40)" in #3's acceptance criteria
- [ ] A user sees only their own notifications
- [ ] Pager with Previous and Next on `?page=`; a bad page number shows the first page
- [ ] Loading, empty, error and success states, stacked rows at 360px
- [ ] Playwright spec with an axe scan over the seeded history


## Contracts already in place

- Read `notifications` with its event (`events`), alert name (`alerts`, null when deleted) and destination name (`destinations`; select `name`, never `settings`). Row Level Security returns only the user's own rows.
- Page with `.range()`: 25 a page, newest first by `created_at`; ask for one extra row to know whether there is a next page. Use the shared `Pager`.
- Shared components: `SeverityMark`, `NotificationStatus`, `SimulatedBadge`, `EmptyState`, `Notice`. Skip reasons arrive ready to show in `skip_reason`; the failure sentence is in `last_error`.
- The seed gives the demo user 34 notifications: sent, skipped and failed ones, one for a simulated event, one whose alert was deleted, and enough for a second page. There is no pending one, on purpose: a tick would send it. Cover the pending row in a component test.
- The end-to-end test signs in as the demo user and only reads. It asserts on the seeded rows it names, never on totals.

## Owned paths

- `src/features/notifications/**`
- `src/app/(app)/notifications/**`
- `e2e/notifications.spec.ts`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, never write through the demo accounts, and read mail with `waitForEmail()` from `e2e/support/mailbox.ts`. Remove your page's `<Placeholder>`.


**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in. The suite runs with reduced motion, so panels and dialogs are scanned fully open.

