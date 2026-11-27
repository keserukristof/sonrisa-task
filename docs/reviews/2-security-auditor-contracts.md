# Increment 2: security audit of the Contracts ticket

- **Agent:** security-auditor
- **Reviewed:** `increment-2`, `0f5e23a..7e969f9` (migrations, shared code, admin frame and pages, Slack stub)
- **Date:** 2026-11-27 19:45

## Dispositions

| #   | Finding                                                                              | Severity | Disposition | Why                                                                                                                                                                                                                | Fixed in              |
| --- | ------------------------------------------------------------------------------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| F1  | `slack_test_target` returns the webhook URL to any holder of the user's session      | major    | accepted    | #4 says the URL is never sent to the browser again. The function now also needs `SLACK_TARGET_KEY`, the Vault secret `slack_target_key`, which only the server holds; without it in Vault, Slack tests fail closed | `ddefbdb`             |
| F2  | Two concurrent removals can leave an alert with no destination                       | minor    | accepted    | `remove_destination` takes the same per-account lock as `add_slack_destination`                                                                                                                                    | `ddefbdb`             |
| F3  | pgTAP misses anonymous, cross-user, non-admin and expiry cases                       | minor    | accepted    | Added to `increment_2_targets.test.sql`: 17 assertions; `pnpm db:test` 120 passing                                                                                                                                 | `ddefbdb`             |
| F4  | #19 does not say what to do when the stored URL fails the settings schema            | minor    | accepted    | #19 now says: finish the test send with `SLACK_INVALID_URL_REASON` and send nothing; `fetch` with `redirect: "error"` (#18)                                                                                        | #18, #19 issue bodies |
| N1  | The database accepts the local stub's URL in production                              | note     | rejected    | The database cannot see the environment; the tick and Send test both re-validate with the production rule before any request, and the auditor found no practical harm (Q2)                                         |                       |
| N2  | Per-destination test limit can be cycled by removing and re-adding                   | note     | rejected    | Meets #4 as written; the harm is our server posting to a webhook the user can post to directly                                                                                                                     |                       |
| N3  | `finish_test_send` stores caller-supplied text, shown only to its owner (and admins) | note     | rejected    | Same as increment 1's N5: rendered as text by React, own account only                                                                                                                                              |                       |

## Report, verbatim

## Security audit: Contracts of increment 2 (#17), branch `increment-2`

I audited HEAD `7e969f9`. HEAD moved during the audit: `7e969f9` committed the four files that were dirty at the start (`deliver.ts`, `env.server.ts` and its test, `filter-links.tsx`), so they are included. Scope was `git diff 0f5e23a..HEAD` over the paths you gave.

`pnpm db:test` passes: 6 files, 109 tests. I also checked the local database with SELECTs only (`prosecdef`, `proacl`, column grants, `rolbypassrls`). I ran no write experiments, not even in a rolled-back transaction. Anything I say about races is reasoned from the code.

**Overall verdict:** implementers can start. There is no blocker and no path to another user's data. One major item (F1) changes the signature of `slack_test_target`, and #19 calls that function, so decide it before #19 starts.

### Findings

- **F1, major.** `supabase/migrations/20261127182535_slack_test_target_and_market_cooldown.sql:12-31`.
  - **What is wrong:** `slack_test_target` is granted to `authenticated`, so the webhook URL can be fetched by anything holding the user's session, not only by the server. That contradicts #4's "After saving, the URL is never shown or sent to the browser again."
  - **Exploit:** someone who has a victim's session (XSS, a stolen refresh token, a shared machine) calls `rpc('claim_test_send', {p_destination_id})` and then `rpc('slack_test_target', {p_test_send_id})`. They get the full webhook URL, and with it permanent posting rights to the victim's Slack channel, even after the session is revoked. Without this function the same session could only trigger test messages.
  - **Limits:** it only ever returns the caller's own URL, for a test claimed in the last minute and not yet finished. Each read costs one of the 5 daily tests, but removing and re-adding the destination resets that (see N2).
  - **Fix:** see Q1.

- **F2, minor.** `supabase/migrations/20261127181812_slack_destinations.sql:98-126`.
  - **What is wrong:** `remove_destination` locks only the destination being removed.
  - **Failure:** take an alert that uses exactly D1 and D2. Two concurrent removals of D1 and D2 each still see the other link, because neither delete is committed yet. Both succeed, and the alert is left with no destination and stops notifying without saying so.
  - **Why only minor:** it affects only the user's own data, and a direct `DELETE` on `alert_destinations` (granted in `20261127150200_alerts.sql:90`) can already empty an alert.
  - **Fix:** take `pg_advisory_xact_lock(hashtext('slack_destinations:' || v_user))` at the start of `remove_destination`. That is the same per-account lock `add_slack_destination` already takes.

- **F3, minor.** `supabase/tests/increment_2.test.sql` and `increment_2_targets.test.sql`. These pgTAP cases are missing:
  - an anonymous caller on any new function (the grants are correct in the database: `has_function_privilege('anon', 'slack_test_target(uuid)')` is false);
  - a non-admin on `admin_email_budget`, `admin_source_health` and `admin_notifications` (only `admin_users` is tested);
  - another user on a Slack `claim_test_send` and on `finish_test_send` with `p_broken_reason`;
  - the one-minute expiry of `slack_test_target`.
  - **Fix:** add them. The rule asks for the owner, another user and an anonymous visitor per object.

- **F4, minor.** #19's send-test steps (issue body line 27) do not say what to do when `slack_test_target` returns a URL that fails `settingsSchema`, for example a stub URL in production.
  - **Failure:** an implementer may return early without calling `finish_test_send`. The test send then stays unfinished, and its URL can be read for that minute.
  - **Fix:** add to #19 that on a parse failure the action calls `finish_test_send(id, false, SLACK_INVALID_URL_REASON.failure, SLACK_INVALID_URL_REASON.broken)` and sends nothing. Also: use `fetch` with `redirect: "error"`.

- **N1, note.** `20261127181812_slack_destinations.sql:43`. The database accepts `http://127.0.0.1:<port>/slack/…` in production. That is safe as built (Q2), but it relies on the application. A database that never accepts the stub would be stricter, but it has no view of the environment. If you want it anyway, a Vault flag `allow_slack_stub` checked by the function would do it.

- **N2, note.** The Slack test limit is per destination and nothing else (`claim_test_send`, around line 197).
  - Removing a destination sets `test_sends.destination_id` to null (`on delete set null`), and a re-added destination gets a new id. A user can therefore cycle add, 5 tests, remove without limit, up to 10 destinations at a time.
  - Harm: our server posts to a webhook the user could post to directly anyway, plus some function cost. It meets #4's "5 per destination" as written.
  - Optional fix: a per-user daily cap, for example 50.

- **N3, note.** `finish_test_send` stores caller-supplied text in `broken_reason` (300 characters) and `error` (500 characters). This is the same as increment 1's N5. It is shown only to the owner, on `/destinations` and `/alerts`, which admins also read. React escapes it. Keep rendering it as text.

### Your questions

**Q1. Is `slack_test_target` acceptable against #4's wording?** Verdict: no, not literally (F1). Read literally, "never sent to the browser again" fails, because any client with the session can fetch the URL. The practical damage is limited to someone who has already stolen a session, but they gain lasting access to the victim's channel.

There is a practical design that needs no admin client. The database already reads secrets from Vault (`20261127150500_scheduler.sql:37-38`, `tick_url` and `tick_secret`), so the same pattern works here:

- Add a dedicated Vault secret, say `slack_target_key`, and a matching server-only `SLACK_TARGET_KEY` in `serverEnv`.
- Change the function to `slack_test_target(p_test_send_id uuid, p_key text)` and return null unless `p_key` equals the Vault value.
- The Server Action passes the key. A browser cannot know it.
- Do not reuse `TICK_SECRET`: its contract is that it can do nothing else.

The alternative is to encrypt the URL in the application with a server-held key before calling `add_slack_destination`, and decrypt it in the Slack channel. That also protects database dumps, but it moves the URL check and the hint into the application, which is more work. Either way, decide it now: the signature is part of #19's contract.

**Q2. Can a stored stub URL do harm in production?** Verdict: no practical SSRF or leak.

- `add_slack_destination` can be called directly, so a stub URL can be stored in production.
- The tick re-parses every stored URL with `slackSettingsSchema(allowLocalStub: false)` and marks the destination broken with `SLACK_INVALID_URL_REASON` (`deliver.ts`, the `safeParse` branch).
- #19 requires the test path to parse the `slack_test_target` result with the same `settingsSchema`.
- Even if both checks were skipped, the only reachable target is 127.0.0.1 inside a Vercel function, on a path under `/slack/` made only of `[A-Za-z0-9/_-]`. There is nothing there to read.
- The remaining gap is F4.

**Q3. Does `allowsLocalSlackStub` fail open anywhere realistic?** Verdict: only on Vercel Preview deployments, and that is harmless. Both signals must be missing for it to open:

- `VERCEL_ENV` is not `production`;
- `REAL_POLLING` is not true. It is set to `true` in Production according to `docs/process/handover-03-build-increment-1.md:128`.

A Preview deployment (`VERCEL_ENV=preview`) accepts stub URLs, which `env.server.test.ts` checks deliberately. If Preview were given the production Supabase variables, stub destinations could reach the production database. The production tick would then mark them broken, and a test from Preview would hit 127.0.0.1 inside the function. I found no setting that gives Preview the production variables (the ship skill only mentions production variables). A self-hosted production build without either variable would also open it, but no such deployment exists.

**Q4. What can a user do with `finish_test_send` beyond their own destinations?** Verdict: nothing.

- The update requires `test_sends.user_id = auth.uid()` and `delivered is null`, so it works once per test send, on the caller's own.
- The destination is read from that row, and `claim_test_send` had checked `d.user_id = v_user`.
- Destinations cannot be moved to another user: there is no update grant, and the foreign keys tie `(id, user_id)` together.

Within their own account a user can:

- mark a destination broken with any text;
- return a broken one to active without actually delivering. The tick re-breaks it on the next permanent failure, or on an invalid URL.
- record a fake "delivered" test.

None of this matters for security.

**Q5. SECURITY DEFINER checks, grants, locks, RLS, the events trigger.**

- **Definer functions:** `add_slack_destination`, `remove_destination`, `claim_test_send`, `finish_test_send` and `slack_test_target` are all `security definer` with `search_path = ''`, give a written reason, check `auth.uid()`, and are granted to `authenticated` only.
  - Each scopes to the caller: by `user_id = v_user`, by a join with `d.user_id = t.user_id`, or by the `test_sends` owner.
  - `remove_destination` refuses the email destination, because it requires `channel_type = 'slack'`.
- **Admin reads:** the four admin functions are `security invoker` and filtered by `is_admin()`, which is itself definer and reads `profiles` by `auth.uid()`. RLS applies underneath as well. Nothing leaks to a non-admin.
- **Column grants:** `settings` is still not selectable. `authenticated` has only `id, user_id, channel_type, name, hint, status, broken_reason, created_at`.
- **Locks (reasoned from code):** I found no deadlock.
  - `remove_destination` takes `FOR UPDATE` on the destination and then updates that destination's notifications.
  - The tick's match takes `KEY SHARE` through the foreign key and waits. If the destination is gone, it fails on the foreign key, and its per-event exception handler (`hardening.sql:284`) leaves the event for the next tick, which no longer joins the removed destination.
  - The claim functions use `skip locked`. The advisory keys are separate: per account, per destination, and `email_budget`.
- **Events trigger:** safe. It is `security invoker` and returns only `NEW` or null. The only callers are `service_role` (the tick, which bypasses RLS and still has EXECUTE through the default privileges, confirmed in `proacl`) and `simulate_event`, which runs as definer and whose source `simulated` the trigger ignores. Events are readable by every signed-in user anyway, so nothing leaks.
  - Reasoned from code: two concurrent inserts for the same coin could both pass, because the trigger takes no lock. That is harmless while ticks are serialised.

### Checked and sound

- **News keyword check:** the migration pauses offending alerts first and then adds the check. It is tested.
- **Names:** the unique name index blocks a duplicate of "Account email". The 10-destination cap is held under the per-account lock and tested. The 5-tests-per-destination limit is held under a per-destination lock, tested, and uses no email budget.
- **Hint:** it shows only the URL's last 4 characters, as #4 says.
- **Admin pages:** `/admin`, `/admin/users`, `/admin/events`, `/admin/notifications` and `/admin/simulate` all call `requireAdmin()` (which uses `getCurrentUser()`, then `notFound()`) inside `<Suspense>`, and the fallback is empty. `e2e/admin-simulate.spec.ts` checks the not-found page, its title and the absence of the Admin nav for a non-admin on all five. The header now links to `/admin`, and only for admins.
- **`filter-links.tsx`:** its hrefs are typed `Route` values supplied by the page, not user input.
- **Slack stub:** binds to 127.0.0.1 only.
- **`supabase/local/demo-data.sql`:** loaded only by the local seed script and not in the Supabase seed paths.
- **Secret key:** no new import of `createAdminClient`. The Slack channel never logs the URL (the placeholder sends nothing).

### Files

- /Users/kristof/Documents/sonrisa-task/supabase/migrations/20261127182535_slack_test_target_and_market_cooldown.sql
- /Users/kristof/Documents/sonrisa-task/supabase/migrations/20261127181812_slack_destinations.sql
- /Users/kristof/Documents/sonrisa-task/supabase/migrations/20261127181814_admin_overview_and_lists.sql
- /Users/kristof/Documents/sonrisa-task/supabase/migrations/20261127150500_scheduler.sql
- /Users/kristof/Documents/sonrisa-task/supabase/tests/increment_2.test.sql
- /Users/kristof/Documents/sonrisa-task/supabase/tests/increment_2_targets.test.sql
- /Users/kristof/Documents/sonrisa-task/src/lib/env.server.ts
- /Users/kristof/Documents/sonrisa-task/src/lib/alerting/tick/deliver.ts
- /Users/kristof/Documents/sonrisa-task/src/lib/alerting/channels/slack/settings.ts
