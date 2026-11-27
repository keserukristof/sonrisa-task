# #24: Admin overview: source health and email budget

- **State:** closed, closed 2026-11-27 19:46 UTC
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/24

## Body

## Parent

#4

## What to build

`/admin` shows each source's last poll, outcome, events stored and status (OK, Late, Failing), or "Not polled in this environment", and today's email budget with test sends. Stories 53, 54. Design: `docs/design/screens/admin-overview.md`. Source health is third to cut under the fallback.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] One row per source with the designed status rules: Late after three intervals (USGS 3 minutes, the Guardian 9, CoinGecko 15), Failing when the last poll failed, Failing over Late, never polled shown as Late
- [ ] "Not polled in this environment" when real polling is off
- [ ] "N of 80 emails sent today (UTC)" with the meter, and "M of 20 test sends"
- [ ] Each section has its own loading and error state
- [ ] A non-admin gets the not-found page; Playwright specs on both projects



## Contracts already in place

- `/admin` is a placeholder that renders `AdminFrame current="overview"` after `requireAdmin()`. Keep that order: nothing of the admin area in the static shell. `AdminFrame` (`src/features/admin/frame/admin-frame.tsx`) draws the title, the `h1` and the tabs.
- **Source health:** `rpc("admin_source_health")` returns one row per polled source: `source, last_polled_at, last_outcome, last_error, last_events_stored, last_success_at`. List every entry of `SOURCE_CATALOG` (`src/lib/alerting/sources/catalog.ts`) in its order, a missing one as never polled; its status comes from `sourceStatus(intervalSeconds, …, now)`, already tested. When `serverEnv().REAL_POLLING` is false, show "Not polled in this environment" instead of the rows.
- **Email budget:** `rpc("admin_email_budget")` returns `{ emails_today, test_sends_today }`. The limits are 80 (`DEFAULT_TICK_CONFIG` in `src/lib/alerting/config.ts`) and 20 test sends. `Meter` is in `src/components/meter.tsx`.
- Both functions return nothing for a non-admin.
- The local demo data has polls of every source, the Guardian's last one failed.

## Owned paths

- `src/features/admin/overview/**` (new)
- `src/app/(app)/admin/page.tsx`
- `e2e/admin-overview.spec.ts` (new)

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. Pending buttons keep focus (`aria-disabled`, not `disabled`; increment 1 UX review, item 5). End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, delete it with `deleteUser()`, and never write through the demo accounts. The local database is shared: assert only on your own rows. Remove your page's "Not built yet." placeholder. Do not add migrations, dependencies, shadcn components, or edit `src/components/ui/` or `globals.css`: report a missing contract instead.

**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in.

## Comments

### keserukristof, 2026-11-27 19:46 UTC

Merged into increment-2; report checked against its diff (owned paths only).

