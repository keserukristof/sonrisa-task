# #26: Admin events list

- **State:** closed, closed 2026-11-27 19:46 UTC
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/26

## Body

## Parent

#4

## What to build

Admins see every event with source, category, severity, time, the Simulated badge and the source credit. Story 51. Design: `docs/design/screens/admin-lists.md`. Second to cut under the fallback.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] Events: title, source, category, severity, time in UTC, Simulated badge, credit; 25 per page, newest first
- [ ] Empty, loading and error states as designed
- [ ] A non-admin gets the not-found page; Playwright specs on both projects



## Contracts already in place

- `/admin/events` is a placeholder rendering `AdminFrame current="events"` after `requireAdmin()`; keep that order.
- Read `id, source, category, severity, title, occurred_at, simulated` from `events` (any signed-in user may; the page is admin-only by `requireAdmin()`), newest `occurred_at` first, 25 a page with `.range()` and an exact count for the pager.
- `sourceName()` and `sourceCredit()` from `src/lib/alerting/sources/catalog.ts`; `CATEGORY_LABELS` from `src/lib/alerting/types.ts`; `SeverityMark`, `SimulatedBadge`, `Pager` from `src/components/`.

## Owned paths

- `src/features/admin/events/**` (new)
- `src/app/(app)/admin/events/**`
- `e2e/admin-events.spec.ts` (new)

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. Pending buttons keep focus (`aria-disabled`, not `disabled`; increment 1 UX review, item 5). End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, delete it with `deleteUser()`, and never write through the demo accounts. The local database is shared: assert only on your own rows. Remove your page's "Not built yet." placeholder. Do not add migrations, dependencies, shadcn components, or edit `src/components/ui/` or `globals.css`: report a missing contract instead.

**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in.

## Comments

### keserukristof, 2026-11-27 19:46 UTC

Merged into increment-2; report checked against its diff (owned paths only).

