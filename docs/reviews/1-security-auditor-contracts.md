# Increment 1: security audit of the Contracts ticket

- **Agent:** security-auditor
- **Reviewed:** `06cc7fc..66eb93a` on `increment-1` (ticket #15, before any feature code)
- **Date:** 2026-11-27 16:11

## Dispositions

| #   | Finding                                                                 | Severity | Disposition | Why                                                                                                                                                                                                                                                | Fixed in  |
| --- | ----------------------------------------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | An oversized keyword stops the tick for all users                       | high     | accepted    | Real: the 40-character limit existed only in Zod. A check constraint now limits each keyword in the database, one failing event no longer stops the batch, and an account has 50 alerts at most. pgTAP covers the constraint                       | `60fc4cf` |
| 2   | One account can use up the daily email budget by claiming test sends    | high     | accepted    | Real. Chosen fix, for the user to confirm: 3 test sends per account per UTC day, and all test sends together limited to 20 of the system's 80, so alert emails always keep 60. The new `test_limit` outcome is in ticket #11                       | `60fc4cf` |
| 3   | The seed holds an admin with a public password, and ship loads the seed | high     | accepted    | Real: the warning comment protected nothing. The demo accounts and their data left the Supabase seed for `supabase/local/demo-data.sql`, loaded only by a script that writes to the local Docker database. `supabase/seed.sql` now creates nothing | `60fc4cf` |
| N1  | pg_net grants: one barrier, checked locally only                        | note     | accepted    | Already recorded in the ADR-0003 addendum and the decision log. Added to ticket #9: the tick route's response carries counts only. The privilege query against the hosted project is a `/ship` step                                                | `7402c19` |
| N2  | `profiles.email` goes stale                                             | note     | accepted    | Tickets #9 and #11 already say the recipient is read from auth when sending; the note is now explicit in #9                                                                                                                                        |           |
| N3  | The confirmation link depends on a client-supplied redirect             | note     | deferred    | Local wildcards are for localhost only. Production's allow-list must be the exact origin: a `/ship` step, written into the ship notes. Ticket #7 is told the confirm route takes no `next`                                                         |           |
| N4  | Two admins can demote each other at once                                | note     | accepted    | `set_user_role` now takes an advisory lock and refuses to demote the last admin                                                                                                                                                                    | `60fc4cf` |
| N5  | `finish_test_send` stores caller-supplied text                          | note     | deferred    | It affects only the caller's own row and nothing renders it yet. Increment 3's admin lists must render it as text; noted for that increment's Refine                                                                                               |           |
| N6  | An event ingested during a pause can match after the alert resumes      | note     | accepted    | It contradicted acceptance criterion 28. Alerts now record when they last became active, and matching requires that to be before the event arrived. pgTAP covers it                                                                                | `60fc4cf` |
| N7  | pgTAP gaps                                                              | note     | accepted    | 22 checks added in `supabase/tests/hardening.test.sql`: anonymous access to the other tables and to `save_alert`, cross-user links, destinations and test sends, the tick functions as a signed-in user, keyword limits and the test-send limit    | `60fc4cf` |
| N8  | The Supabase rule says the secret key is not used                       | note     | accepted    | The rule now says the tick uses it, and nothing else                                                                                                                                                                                               | `60fc4cf` |

Not done from the report: a dedicated test that one failing event leaves the rest of the batch matched. The constraint removes the known way to make an event fail, and the tick ticket's integration tests exercise the function.

## Report, verbatim

## Security audit, increment 1 Contracts (#15), commits 06cc7fc..66eb93a

I found three findings that can be exploited, plus notes. The most serious one is new: one signed-in user can stop alerting for every user, permanently.

`pnpm db:test` passes (52 checks). I ran three exploit checks in `begin … rollback` transactions, so no data was changed. One stray regex timing query of mine ran past 120 s and I cancelled it with `pg_cancel_backend`. I did not edit any files.

---

### HIGH 1: An oversized keyword stops the tick for all users, permanently

- **Where:**
  - `supabase/migrations/20261127150200_alerts.sql:10`: the only database limit is `cardinality(keywords) <= 10`. There is no limit on the length of each keyword.
  - Lines 28–29 grant `insert` and `update` on `keywords` to `authenticated`.
  - `20261127150600_tick_functions.sql:17-21` builds a regex from each keyword.
  - The 40-character limit exists only in Zod (`src/features/alerts/schema.ts:5`).
- **Scenario:** A signed-in user skips the Server Action and calls PostgREST directly with the publishable key and their own JWT: `PATCH /rest/v1/alerts?id=eq.<own alert>` with `{"keywords":["xxxx…50,000 chars"]}`. The alert needs to be active, in `natural_disasters`, and linked to their email destination. At the next tick:
  - `text_has_word` raises `invalid regular expression: regular expression is too complex` after about 7 s.
  - That aborts all of `tick_match_events`, so the event never gets `matched_at`.
  - The event is first in `ingested_at` order, so every later tick fails on the same event.
  - Nobody receives an alert again until someone removes the row by hand.
- **Evidence:** Run as the demo user, rolled back: the `UPDATE 1` succeeded and stored 50,000 characters. Then `tick_match_events(...)` failed with `ERROR: invalid regular expression: regular expression is too complex … PL/pgSQL function public.tick_match_events … line 23`, after 7103 ms.
  - Below the error threshold it is still costly: a 10,000-character keyword took 296 ms per evaluation. Multiply that by 10 keywords and 200 events per batch.
  - All of this runs while the `email_budget` advisory lock is held, so it also stalls "Send test".
- **Fix:** Enforce the limit in the database. A `check` constraint cannot contain a subquery, so it needs an immutable helper function:
  ```sql
  create function public.keywords_valid(k text[]) returns boolean language sql immutable set search_path = '' as
  $$ select coalesce(bool_and(char_length(x) between 1 and 40 and x = lower(btrim(x))), true) from unnest(k) x $$;
  alter table public.alerts add constraint alerts_keywords_valid check (public.keywords_valid(keywords));
  ```
  - This also rejects `''`. An empty keyword currently matches any text containing two adjacent non-word characters (`text_has_word('', ' - ')` is true).
  - Defence in depth: wrap each alert's evaluation in `tick_match_events` in `begin … exception`, so one bad row cannot poison the batch.
  - Also consider a cap on the number of alerts per user. Nothing limits how many alerts a user can insert directly.

### HIGH 2: One account can use up the system's daily email budget without sending any email

- **Where:**
  - `20261127150400_notifications.sql:88-91`: `email_usage` counts every `test_sends` row with `channel_type = 'email'`, whether or not it was finished or delivered.
  - Lines 111–158: `claim_test_send` is executable by `authenticated` and limits only to 10 per user per hour.
- **Scenario:** A user calls `supabase.rpc('claim_test_send', {p_destination_id: <own email destination>})` directly from the browser, 10 times an hour. No email is sent and `finish_test_send` is never called.
  - After 8 hours, or immediately with 8 confirmed accounts, `system_day` reaches 80.
  - Every user's alert email for the rest of the UTC day is recorded as `skipped` ("Daily system limit (80) reached").
  - It can be repeated every day at no cost.
- **Evidence:** Run as the demo user in a loop, rolled back. The outcomes were `ok` ×10, then `hourly_limit hourly_limit`. `test_sends` held 10 rows, all with `delivered is null`, and `email_usage` returned `10|10`.
- **Fix:** This is a design choice, so the user should make it. The smallest options:
  - (a) Add a per-user daily cap on test claims inside `claim_test_send`, for example 3 a day. One account then costs at most 3 of the 80.
  - (b) Make `claim_test_send` callable only from the server, and give "Send test" a separate small budget.
  - Not counting rows left at `delivered is null` does not help, because the attacker simply never finishes them.

### HIGH 3: The ship skill says to load demo data, and the only demo data includes an admin with a public password

- **Where:**
  - `supabase/seed.sql:4-10, 26-27, 49-50`.
  - `.claude/skills/ship/SKILL.md:55`: "With approval, load the demo data reviewers need."
  - `supabase/config.jsonc:77-83`: `sql_paths: ["./seed.sql"]`.
- **Scenario:** `/ship` reaches step 4, and the only demo data in the repository is `seed.sql`. If it is loaded:
  - Anyone who reads the repository signs in to production as `admin@heads-up.test` / `admin-password`.
  - They can read every user's profile and email, alerts, notifications and test sends, which the admin policies allow.
  - They can promote other accounts with `set_user_role`.
  - They can call `simulate_event`, which sends email to every matching user and uses the shared budget.
  - The demo user's password is public too. Because `secure_password_change: false` (config.jsonc), anyone can change that password and lock reviewers out.
- **Assessment:** The warning comment does not protect anything, because the procedure tells the operator to do exactly what the comment forbids. The seed is also applied automatically to any Supabase preview branch, if branching is ever turned on.
- **Fix:** Split the seed. Keep `seed.sql` for local use only, and give production a separate, idempotent demo-content file with events and no accounts. Create production accounts with generated passwords and hand them over privately, as story 67 says. Change ship step 4 to name that file explicitly.

---

### Notes (no exploit scenario today; implementers should know them)

1. **pg_net grants (question 4):** the reasoning holds, but only one barrier remains, and I checked it locally only.
   - `net` nspacl is `anon=U/supabase_admin, authenticated=U/supabase_admin`. Both `http_request_queue` and `_http_response` have `=arwdDxtm/supabase_admin` (granted to PUBLIC), and `anon`/`authenticated` can execute `net.http_post`, `http_get` and `http_delete`. This confirms the grantor claim.
   - The only barrier is that PostgREST does not expose the schema (`supabase/config.jsonc:14`). `e2e/smoke.spec.ts:75-87` does assert the 406.
   - pg_graphql is not installed locally. The `supabase_realtime` publication has no tables. No function in `public` reads `net` or runs dynamic SQL.
   - `vault.secrets` and `vault.decrypted_secrets` are not readable by `anon` or `authenticated`, and the API roles have no usage on `vault` or `private`.
   - At `/ship`, run the same privilege query against the cloud project, and confirm that pg_graphql is either disabled or does not reflect `net`.
   - pg_net keeps responses in `net._http_response`, which PUBLIC can read at the privilege level. The tick route's response body must therefore contain no personal data or error details. Counts are fine.
   - Spec #2 line 127 says the pg_net migration "restricts the net schema". That is not what was built, so record it in the decision log or ADR-0003.
2. **`profiles.email` goes stale.** It is copied once in `handle_new_user` (`20261127150100_destinations.sql:50-51`), but a user can change their email through the auth API. The email channel must take the recipient from `auth.users` or the JWT, never from `profiles`.
3. **The confirmation link depends on a client-supplied redirect.** `supabase/templates/confirmation.html:8` builds it from `{{ .RedirectTo }}`, which comes from the sign-up request. Production's redirect allow-list must be the exact production origin, with no `*.vercel.app` wildcard. Otherwise a victim's confirmation token could be sent to an attacker's site. The future `/auth/confirm` route must pass any `next` through `safeNextPath`.
4. **Two admins can demote each other.** `set_user_role` (`20261127150000_profiles_and_roles.sql:47-69`) has no lock and no last-admin check. Two concurrent demotions could leave no admin, against story 57. Only admins can trigger this. Fix: take `pg_advisory_xact_lock` and refuse if the demotion would leave zero admins.
5. **`finish_test_send` takes caller-supplied text.** A user can mark their own test as delivered or write any 500-character `error`. It affects only their own row, but admin views in increment 3 must render it as text.
6. **Pause race.** An event ingested while an alert is paused, but not matched until after it resumes, will match it. This contradicts acceptance criterion 28 by up to one tick. It is functional, not a security issue.
7. **pgTAP gaps** (`supabase/tests/rls.test.sql`):
   - Anonymous checks cover only `alerts` and `notifications`. `profiles`, `destinations`, `events`, `test_sends`, `alert_destinations` and the RPCs are not checked.
   - No test has user B call `finish_test_send` on A's row, read A's destinations or links, or insert an `alert_destinations` row with A's `alert_id`.
   - `tick_claim_notifications` and `text_has_word` are not tested as `authenticated`.
   - There is no test for keyword length (HIGH 1) or the test-send budget (HIGH 2).
8. **Stale rule.** `.claude/rules/supabase.md` says the secret key "is not used by this app today". It is now used by the tick (`src/lib/supabase/admin.ts`). Update the rule so implementers are not confused.

---

### Answers to your seven questions

1. **RLS and grants: no problem found** for cross-user reads or writes.
   - Table grants are exactly select/delete plus the column-level insert and update grants listed in the migrations.
   - `destinations.settings` is excluded from the column grant (tested).
   - `user_id`, `created_at` and `updated_at` cannot be inserted or updated by users, so an alert cannot be backdated.
   - The composite foreign keys on `alert_destinations` stop links across users.
   - Events and notifications are not writable by the API roles.
   - The keyword column is the exception: HIGH 1.
2. **SECURITY DEFINER functions:** every one has `search_path = ''` and a written reason. EXECUTE is limited to `authenticated` (plus the default `service_role`). `handle_new_user` cannot be called and ignores user metadata.
   - The checks in `is_admin`, `set_user_role`, `simulate_event` and `finish_test_send` are sufficient, apart from note 4.
   - `claim_test_send` reveals nothing about other users: it returns the same "not found" for a foreign destination as for a missing one, and only reveals whether the system as a whole is at 80. But it can be used to exhaust the budget: HIGH 2.
3. **Tick functions: service_role only (confirmed).** Execute is granted to `{service_role}` only.
   - No regex injection: I tested `.`, `(?i)`, `\m`, `\y`, `[[:alpha:]]`, `***=`, `{1,3}`, `^`, `-` and a trailing `\`, and each was matched literally.
   - The real risk is regex complexity: HIGH 1.
4. **Scheduler:** the reasoning is sound, and I found no path to `net` or Vault from an API role locally. Caveats are in note 1.
5. **`safeNextPath` and `withNotice`: no problem found.** `//`, `\`, absolute URLs and control characters are all rejected. `withNotice` adds only a fixed enum value to a typed route.
6. **Seed:** the warning is not enough, because the ship procedure contradicts it: HIGH 3.
7. **Other issues:** HIGH 1 and notes 2, 3 and 8 are the ones implementers are most likely to build on wrongly.

**Also checked and sound:**

- Every page under `(app)` calls `requireUser`, or `requireAdmin` for simulate, except `/admin`, which only redirects.
- Identity comes from `getClaims()`, and `getSession` is not used anywhere.
- There is no `"use cache"` with the cookie client.
- The secret key is read only in `admin.ts`, behind `server-only`, and the only `NEXT_PUBLIC_*` variables are the URL and the publishable key.
- The sign-in action validates with Zod and gives a generic error.
- There are no storage buckets (`count = 0`).
- `health_check` exposes only the database clock.
- `scripts/local-env.mjs` writes secrets through stdin and stays local.
