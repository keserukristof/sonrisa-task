# #9: Alerting tick: poll, match, limit, deliver

- **State:** open
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/9

## Body

## Parent

#3

## What to build

The alerting core: one `runTick` that polls due sources, stores events, matches them against active alerts, applies the email limits and delivers pending notifications with retries, plus the tick route the scheduler calls with its own secret. It imports nothing from Next.js and receives its collaborators: database client, sources, channels, clock and configuration.

Stories 30, 32, 35, 36, 38, 39, 60, 61, 62 and 64 of #3. Behaviour: spec #2, "Tick steps".

## Acceptance criteria

- [ ] Integration tests over the local database with fake sources, fake channels and a fake clock, covering every `runTick` case listed under "Tests this increment adds" in #3
- [ ] Matching on category, severity and whole-word, case-insensitive keywords; only alerts created before the event was ingested; paused alerts never match. The rules themselves live in the database function `tick_match_events` (Contracts): the tests prove them through `runTick`
- [ ] One notification per event and destination
- [ ] Email limits: 10 per user per rolling hour, 80 per UTC day across the system, counting test sends; over a limit the notification is skipped with its reason
- [ ] Retries at 1, 5 and 15 minutes, then failed with the last error
- [ ] Two ticks back to back or at once send each notification once
- [ ] The tick route accepts only the tick secret, compared in constant time, and answers 401 otherwise
- [ ] A source that throws is recorded in source polls and does not stop the others


## Contracts already in place

- Types: `Source`, `Channel`, `Clock`, `SendOutcome`, `OutgoingNotification` in `src/lib/alerting/types.ts`; `TickConfig`, `DEFAULT_TICK_CONFIG` and `SKIP_REASONS` in `config.ts`. Read them, do not edit them.
- The database client is the admin client (`src/lib/supabase/admin.ts`, type `AdminClient`). `runTick` receives it; only the tick route creates it.
- **Match and limit are one database call:** `rpc("tick_match_events", { p_now, p_emails_per_user_per_hour, p_emails_per_system_per_day })`. It finds unmatched events, creates notifications as `pending` or `skipped` with the reason, and marks events matched. Read its comment in `supabase/migrations/20261127150600_tick_functions.sql` for the exact rules; do not reimplement them in TypeScript.
- **Claiming for delivery is one database call:** `rpc("tick_claim_notifications", { p_now, p_lease_seconds })`. It returns each due notification with its event, alert name and destination settings, having counted the attempt and leased it. After sending, record the outcome with a plain update, as that function's comment lists. Four attempts in all: the retry delays are `retryDelaysSeconds`.
- The recipient of an email is the account's address, read with `auth.admin.getUserById` when sending.
- Polling: store candidates with an insert that ignores conflicts on `(source, external_id)`; record every poll in `source_polls`; poll a source only when `realPolling` is on and its interval has passed since its last poll.
- The tick route is `POST /api/tick` with `Authorization: Bearer <TICK_SECRET>`, compared in constant time (`serverEnv().TICK_SECRET`); it gets its sources and channels from `buildSources()` and `buildChannels()` in `collaborators.ts`, which ticket #14 fills.
- **Integration tests are `*.dbtest.ts`**, run with `pnpm test:db` (not part of `pnpm verify`, which has no database in CI). They use the real local database through the admin client, with fake sources, fake channels and a fake clock.
- **The database is shared and matching is global.** Another ticket's events and alerts, and the seed's, are in the same tables, and a tick in your test processes them too. So: create your own users with the admin API; give each test a clock in its own far-future window (a different year per test), so the hourly and daily email windows contain only its rows; assert only on rows of your own users; never assert that a table or a tick's totals are empty or exact.

## Owned paths

- `src/lib/alerting/run-tick.ts`, `src/lib/alerting/tick/**`
- `src/lib/alerting/*.dbtest.ts`, `src/lib/alerting/testing/**`
- `src/app/api/tick/route.ts` (new)

Not yours: `src/lib/alerting/types.ts`, `config.ts`, `collaborators.ts`, `sources/**`, `channels/**`.

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, never write through the demo accounts, and read mail with `waitForEmail()` from `e2e/support/mailbox.ts`. Remove your page's `<Placeholder>`.


**Fake channels answer `sent` for any notification that is not the test's own.** A fake that answers `broken` or `retry` by default would mark other tickets' and the seed's destinations broken, for everyone, in the shared database. Make failure the exception, keyed on the test's own event or user.

