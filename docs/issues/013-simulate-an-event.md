# #13: Simulate an event

- **State:** closed, closed 2026-11-27 18:05 UTC
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/13

## Body

## Parent

#3

## What to build

An admin creates a simulated event by choosing its category, severity, title and optional summary and link. The event is stored, marked simulated, and left for the next scheduled tick; nothing is sent from the action.

Stories 58 and 59 of #3. Screen: `docs/design/screens/admin-simulate.md`.

## Acceptance criteria

- [ ] Everything under "Admin slice (stories 58–60)" in #3's acceptance criteria except the delivery, which is #14's
- [ ] `/admin` redirects to `/admin/simulate`; a non-admin or signed-out visitor gets the not-found page
- [ ] The action re-checks the admin role and validates with the shared Zod schema; news is forced to low
- [ ] Success shows the "Event created" notice and resets the form



## Contracts already in place

- `src/features/admin/schema.ts` has `simulateEventSchema`, with tests.
- The action calls `supabase.rpc("simulate_event", { p_category, p_severity, p_title, p_summary, p_url })` as the signed-in user. The database checks the admin role (`42501` otherwise), marks the event simulated and forces news to low. The action also checks `isCurrentUserAdmin()` first and returns an error result, so a non-admin never reaches the database.
- The page guards with `requireAdmin()`, which shows the not-found page to anyone else; `/admin` already redirects to `/admin/simulate`.
- Labels: `CATEGORY_LABELS`, `SEVERITY_LABELS`. The success notice stays on the page, so it is a `Notice` rendered from the action's result, not a redirect notice.
- End-to-end test: `createUser({ admin: true })`, simulate, expect the notice. Delivery is ticket #14's.

## Owned paths

- `src/features/admin/**`
- `src/app/(app)/admin/**`
- `e2e/admin-simulate.spec.ts`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, never write through the demo accounts, and read mail with `waitForEmail()` from `e2e/support/mailbox.ts`. Remove your page's `<Placeholder>`.


**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in. The suite runs with reduced motion, so panels and dialogs are scanned fully open.

