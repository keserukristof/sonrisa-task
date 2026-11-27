# #20: Alerts: Slack destinations and the news keyword rule

- **State:** closed, closed 2026-11-27 19:46 UTC
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/ai-task/issues/20

## Body

## Parent

#4

## What to build

The alert form offers Slack destinations beside the account email, the alerts list marks a broken destination by name, and news alerts need at least one keyword. Stories 15 (alerts side) and 41 (the rule). Design: `docs/design/screens/alerts-list.md`, `alert-form.md`.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] The form lists every destination as a checkbox, Slack ones by name with a broken mark where broken
- [ ] The alerts list names every destination of an alert and marks a broken one as "<name> (broken)"
- [ ] For News, Keywords is required, with the designed hint; with none, the form shows "News alerts need at least one keyword, or every article would notify you."
- [ ] Resuming a keyword-less news alert is refused and the switch reverts with the designed message
- [ ] Playwright specs on both projects



## Contracts already in place

- **The news rule:** `alertSchema` in `src/features/alerts/schema.ts` already refuses a news alert with no keyword, with `NEWS_NEEDS_KEYWORDS` on the `keywords` field. The database check `alerts_news_needs_keywords` (error `23514`) also refuses resuming a paused news alert that has none: the switch reverts with `NEWS_NEEDS_KEYWORDS + " Edit the alert to add one."`. `save_alert` raises `23514` for both "no destination" and this rule: tell them apart by the constraint name in the error message.
- **Destinations on the form and list:** read `id, name, channel_type, status` from `destinations` in this feature's own `queries.ts` (features do not import each other). Order: email first, then Slack oldest first. A broken one shows `BrokenMark` (`src/components/broken-mark.tsx`): "Broken" on the form, "<name> (broken)" on the list.
- The migration paused existing keyword-less news alerts; nothing to do for them here.
- The demo user has two Slack destinations ("Ops channel", "Incident room" broken) and an alert, "Crypto swings", that uses one. Read them, never change them.

## Owned paths

- `src/features/alerts/**`, except `schema.ts` and `schema.test.ts`
- `src/app/(app)/alerts/**`
- `e2e/alerts.spec.ts`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. Pending buttons keep focus (`aria-disabled`, not `disabled`; increment 1 UX review, item 5). End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, delete it with `deleteUser()`, and never write through the demo accounts. The local database is shared: assert only on your own rows. Remove your page's "Not built yet." placeholder. Do not add migrations, dependencies, shadcn components, or edit `src/components/ui/` or `globals.css`: report a missing contract instead.

**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in.

## Comments

### keserukristof, 2026-11-27 19:46 UTC

Merged into increment-2; report checked against its diff (owned paths only).

