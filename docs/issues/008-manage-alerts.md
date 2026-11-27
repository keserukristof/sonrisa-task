# #8: Manage alerts

- **State:** closed, closed 2026-11-27 18:05 UTC
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/8

## Body

## Parent

#3

## What to build

A user can see their alerts, create one by choosing a name, category, minimum severity, optional keywords and destinations, edit it, pause and resume it in one click, and delete it after confirming.

Stories 18–31 of #3 (story 20 brought forward). Screens: `docs/design/screens/alerts-list.md`, `alert-form.md`.

## Acceptance criteria

- [ ] Everything under "Alerts" in #3's acceptance criteria, except matching, which is the tick's
- [ ] Every Server Action re-checks the user and validates with the shared Zod schema
- [ ] Loading, empty, error and success states as designed, at 360px and desktop
- [ ] Editing keeps the creation time; another user's alert gives the not-found page
- [ ] Playwright spec with an axe scan: create, edit, pause, resume and delete an alert; a form without a destination shows the field error


## Contracts already in place

- `src/features/alerts/schema.ts` has `alertSchema`, `parseKeywords` and the limits, with tests.
- Create and edit go through one database call, `supabase.rpc("save_alert", …)`: pass a null id to create. It writes the alert and its destinations in one transaction, as the user. It raises `23514` without a destination, `23503` for a destination that is not the user's, `P0002` for an alert that is not theirs.
- Pause and resume are an update of `active`; delete is a delete. The database lets a user change only `name`, `category`, `min_severity`, `keywords` and `active`, so the creation time cannot move.
- Destinations for the form: select `id, name, channel_type` from `destinations` (never `settings`, which is not readable). The address shown next to "Account email" is the signed-in user's email.
- Labels: `CATEGORY_LABELS`, `MIN_SEVERITY_LABELS` in `src/lib/alerting/types.ts`. Shared components: `SeverityMark` (`kind="minimum"`), `KeywordChip`, `EmptyState`, `Notice`, `FlashNotice`, `PageContainer`, `PageHeader`.
- Seeded alerts exist for the demo user, for looking at the list. Tests use their own account.

## Owned paths

- `src/features/alerts/**`
- `src/app/(app)/alerts/**`
- `e2e/alerts.spec.ts`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, never write through the demo accounts, and read mail with `waitForEmail()` from `e2e/support/mailbox.ts`. Remove your page's `<Placeholder>`.


**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in. The suite runs with reduced motion, so panels and dialogs are scanned fully open.


**After the security audit:** the database now enforces the keyword rules too (each 1 to 40 characters, trimmed, lowercase) and allows 50 alerts per account; both raise `23514`. Map a `23514` on create to "You've reached 50 alerts. Delete one to add another." Resuming an alert sets the time it became active in the database; nothing to do in the action.

