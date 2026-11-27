# #14: End to end: a simulated event arrives by email

- **State:** closed, closed 2026-11-27 18:05 UTC
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/14

## Body

## Parent

#3

## What to build

The whole path works end to end: the tick route runs `runTick` with the real USGS source and the real email channel, so an admin's simulated event is matched, sent and shown as sent, and the email arrives in the local mail catcher.

Story 60 of #3, and the proof for stories 32, 33, 35 and 61.

## Acceptance criteria

- [ ] The tick route builds the production collaborators: the USGS source, the email channel, the system clock and the configured limits
- [ ] Playwright spec with an axe scan: an admin with a matching alert simulates an event, a tick runs against the local stack, the notification shows as sent with the Simulated badge, and the email with the `[SIMULATED]` subject is in the mail catcher
- [ ] Locally the `pg_cron` job reaches the tick route and a tick runs without anyone visiting the site


## Contracts already in place

- `src/lib/alerting/collaborators.ts` has `buildSources()` and `buildChannels()` returning empty lists. Register the USGS source and the email channel there; the tick route already calls them.
- The end-to-end test triggers the tick itself: `POST /api/tick` on the test's own base URL with `Authorization: Bearer ${process.env.TICK_SECRET}` (Playwright loads `.env.local`). It does not wait for the scheduler, which calls port 3000 only.
- Use `createUser({ admin: true })`, create a matching alert through the UI or the `save_alert` function, simulate, tick, then check history and `waitForEmail(address, "[SIMULATED]")`.
- The scheduler check ("the job reaches the tick route") is done by hand against `pnpm dev`: `select status, return_message from cron.job_run_details order by start_time desc limit 3` and the route's log. Record the result in the pull request.

## Owned paths

- `src/lib/alerting/collaborators.ts`
- `e2e/end-to-end.spec.ts`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, never write through the demo accounts, and read mail with `waitForEmail()` from `e2e/support/mailbox.ts`. Remove your page's `<Placeholder>`.


**Delete the account in the test's teardown** with `deleteUser()`: every email counts toward the system's 80 a day, which all runs share until the account is gone.


**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in. The suite runs with reduced motion, so panels and dialogs are scanned fully open.

