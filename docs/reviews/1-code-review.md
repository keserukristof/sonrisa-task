# Increment 1: code review

- **Agent:** reviewer ×2 (`mattpocock-skills:code-review`, Standards and Spec axes in parallel)
- **Reviewed:** `a663772...increment-1` at `b3f9b03` (tickets #7 to #14); spec bound: increment #3
- **Date:** 2026-11-27 17:45

## Dispositions

### Standards

| #   | Finding                                                                         | Severity  | Disposition | Why                                                                                                                                                                            | Fixed in             |
| --- | ------------------------------------------------------------------------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| S1  | `e2e/notifications.spec.ts` asserts a total count for the shared demo user      | hard      | accepted    | testing.md forbids it; it can flake when another test adds notifications                                                                                                       | `906e0d3`            |
| S2  | `.overrideTypes` on notifications is an unchecked cast                          | hard      | accepted    | Non-negotiable 5                                                                                                                                                               | `906e0d3`            |
| S3  | Supabase `error` ignored in `finish_test_send`, `deliver.ts`, `poll.ts`         | hard      | accepted    | supabase.md "Always check `error`"                                                                                                                                             | `804a509, `eb8a1cf`` |
| S4  | Arbitrary grid values in `notification-list.tsx`                                | hard      | accepted    | ui.md; needed `globals.css`, so the main session did it                                                                                                                        | `0e7c963`            |
| S5  | Destinations filtered in JS; empty list renders a bare `<ul>`                   | hard      | accepted    | supabase.md and Non-negotiable 6                                                                                                                                               | `eb8a1cf`            |
| S6  | `getAlerts` has no `.range()`                                                   | judgement | rejected    | An account has 50 alerts at most (database check); the design has no pager on the alerts list                                                                                  |                      |
| S7  | Duplicated `errorText`/`message` in tick                                        | judgement | accepted    | Same function twice in one module                                                                                                                                              | `804a509`            |
| S8  | Other duplication (skeleton header, error page header, two destination queries) | judgement | rejected    | Skeletons mirror their layout on purpose; features may not import each other (`CLAUDE.md` Architecture)                                                                        |                      |
| S9  | Primitive Obsession: `channelType: string`, `REFUSALS: Record<string, string>`  | judgement | rejected    | The values come from generated types of check-constrained text columns; a union would be hand-maintained beside them. Increment 2 adds Slack and is the place to type channels |                      |
| S10 | `KeywordChip` exported from `simulated-badge`                                   | judgement | rejected    | Cosmetic; no reader confusion found in review. Not worth a shared-file change during the build                                                                                 |                      |
| S11 | The two `as` casts in `saveAlert`                                               | judgement | deferred    | The generated RPC types mark nullable arguments non-null; the only fixes are a cast or a hand-edited types file, which is denied. Kept with their comments; known limitation   |                      |

### Spec

| #   | Finding                                                                                   | Severity  | Disposition | Why                                                                                                                                                                    | Fixed in                                         |
| --- | ----------------------------------------------------------------------------------------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| P1  | A permanent email failure marks the account email `broken` and silences the user for good | hard      | accepted    | The account email can't be removed; marking broken is increment 2's Slack story. Same root as security finding 2                                                       | `804a509`                                        |
| P2  | The 20-a-day test cap reports the 80-email limit                                          | hard      | accepted    | "the reason names the limit". Needed a migration, so the main session did the database half                                                                            | `acae04e`, `eb8a1cf`                             |
| P3  | Send test failure gives no reason                                                         | partial   | rejected    | The approved design gives one failure sentence for Send test, and the security audit argues against showing provider text. The design wins over the looser spec line   |                                                  |
| P4  | Recorded USGS responses are used only in unit tests                                       | judgement | deferred    | Local development delivers through simulated events, which the spec also names; replaying recordings into the local tick is not needed for any story. Known limitation |                                                  |
| P5  | A pending row with no attempts shows no time                                              | judgement | accepted    | Match the design, whatever it says                                                                                                                                     | no change: the design shows "Waiting to be sent" |
| P6  | Plain-text email has a bare URL without "View at source"                                  | minor     | accepted    | One-line wording fix                                                                                                                                                   | `804a509`                                        |

## Report, verbatim: Standards

I found five hard violations of documented rules and four judgement calls. I left out the three findings you already know about, and I did not look at `docs/`.

**Hard violations**

1. **`/Users/kristof/Documents/sonrisa-task/e2e/notifications.spec.ts:56`** asserts `expect(page.getByRole("listitem")).toHaveCount(25)` for `DEMO_USER`. Lines 70 and 75-80 assume Hualien is on page 1. A simulated event from another worktree adds notifications for the demo user, which moves Hualien to page 2. This breaks testing.md: "Never assert on a total count, on an empty list, or on anything another agent's test could change for the shared demo user." Fix: give the pager test its own user and seed it, or assert on relative paging only.

2. **`/Users/kristof/Documents/sonrisa-task/src/features/notifications/queries.ts`** uses `.overrideTypes<RawNotification[], { merge: false }>()`. This is an unchecked assertion of the shape of external data, the same thing as an `as` cast. It breaks Non-negotiable 5: "no `as` casts on external data … Parse, do not assume." `alerts/queries.ts` already parses its embedded relations with Zod. Fix: do the same here.

3. **Supabase `error` ignored**, against supabase.md "Always check `error`":
   - `/Users/kristof/Documents/sonrisa-task/src/features/destinations/actions.ts`: the `finish_test_send` result is never read.
   - `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/tick/deliver.ts`: the four `notifications` updates and the `destinations` update.
   - `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/tick/poll.ts`: the `source_polls` insert.

   Fix: destructure `error` and count or log it.

4. **`/Users/kristof/Documents/sonrisa-task/src/features/notifications/notification-list.tsx:9`** uses `sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_120px_200px]`, and the `<dl>` uses `grid-cols-[auto_1fr]`. This breaks ui.md: "No … arbitrary values … in feature code." Fix: add a grid template token or utility in globals.css, through a Contracts change.

5. **`/Users/kristof/Documents/sonrisa-task/src/features/destinations/destination-list.tsx`** filters in JavaScript with `.filter((destination) => destination.channelType === "email")`. This breaks supabase.md: "Filter in the database, not in JavaScript." Fix: add `.eq("channel_type", "email")` in `listDestinations`. In the same file, an empty list renders a bare `<ul>`, which breaks Non-negotiable 6 (every view handles empty).

**Judgement calls (baseline smells)**

- **`getAlerts` has no `.range()`.** supabase.md says "Paginate lists with `.range()`." The 50-alert cap makes this defensible, so it is borderline.
- **Duplicated Code:**
  - `errorText` in `deliver.ts` and `message` in `poll.ts` are the same function.
  - `.update(...).eq("id", row.notification_id).eq("status", "pending")` appears four times in `deliver.ts`.
  - The notification header row is copied into `NotificationListSkeleton`.
  - The page header and intro are copied between `destinations/error.tsx` and `page.tsx`.
  - `getDestinationOptions` (alerts) nearly repeats `listDestinations` (destinations). This is expected, because features may not import each other.
- **Primitive Obsession:**
  - `channelType: string` appears in both destination DTOs.
  - `REFUSALS: Record<string, string>` is keyed by the RPC outcome strings.
  - A closed union type would fit both.
- **Mysterious Name:** `KeywordChip` is exported from `@/components/simulated-badge`.

**Your question about the two `as` casts** in `/Users/kristof/Documents/sonrisa-task/src/features/alerts/actions.ts`: they cast values the code built itself, after Zod has validated them. They do not cast data coming from outside, so the "external data" ban in Non-negotiable 5 does not strictly apply.

- `p_alert_id: alertId as string` is acceptable. The comment explains it, and a regenerated-types fix would remove it.
- `parsed.data.minSeverity as "low"` is worse. It sends `null` while claiming the literal `"low"`, so it hides the nullability problem rather than documenting it. Prefer one typed wrapper or a typed override of the RPC args for both.

## Report, verbatim: Spec

Spec review of `git diff a663772...HEAD` against increment #3. I found three hard problems and two judgement calls. Everything else I checked matches the acceptance criteria: sign-up and confirm, the sign-in messages, the confirm route, the tick secret check, the USGS severity and PAGER rules, the retry plan, keyword parsing, news severity, the simulate copy and news-forced-low, the email subject and simulated banner, "Deleted alert" and "Simulated" in history, and the tick test list.

**1. Hard (bug, scope creep): one permanent email failure silently turns off a user's alerts for good.**

- In `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/tick/deliver.ts:61-72`, a `broken` outcome sets the email destination to `status='broken'`.
- `tick_match_events` only matches destinations where `d.status = 'active'` (`supabase/migrations/20261127150600_tick_functions.sql:81`).
- `classifyResendResponse` returns broken for any non-retryable 4xx, such as a 401/403 for a bad key or unverified domain. `classifySmtpError` does the same for any 5xx. So one provider misconfiguration breaks every user who gets a notification.
- Nothing shows or clears it: nothing under `src/features` reads `broken`, and Send test does not reset it.
- Spec: "Every new account has exactly one email destination… 'can't be removed'". Marking a destination broken is story 15 (Slack), which belongs to increment 2.
- Smallest fix: for `channel_type = 'email'`, mark only the notification failed and leave the destination alone. Adjust the dbtest at `run-tick.dbtest.ts:371` to match.

**2. Hard (wrong): the 20-a-day test cap reports the wrong limit.**

- `claim_test_send` returns `daily_limit` for both `v_system_tests >= 20` and `system_day >= 80` (`supabase/migrations/20261127150700_hardening.sql:170`).
- `/Users/kristof/Documents/sonrisa-task/src/features/destinations/test-result.ts:8` then shows "Heads-up has reached its 80 emails for today" when the real cause is the 20-test cap.
- Spec: "Over either limit it is refused, and the reason names the limit… all test sends together use at most 20 of the system's 80 a day."
- Fix: give the 20-test cap its own outcome code and its own sentence.

**3. Partial: Send test failure gives no reason.**

- `/Users/kristof/Documents/sonrisa-task/src/features/destinations/actions.ts:48` returns `FAILED` whatever the outcome, so the user always sees "Couldn't send the test. Try again in a minute."
- Spec: "shows the result inline: 'Delivered at HH:MM UTC', or the reason it failed."
- The design table allows this one sentence, so the spec and the design disagree. This is close to your known raw-error item but is the Send test path, not history.

**4. Judgement: recorded USGS responses are used only in unit tests.**

- `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/collaborators.ts` wires only the live `usgsSource`. With `REAL_POLLING` off, local dev never gets a USGS event.
- Spec: "Local development runs with no keys, using recorded USGS responses committed to the repository, and simulated events."
- This may be an accepted reading (tests use them, and local dev uses simulated events). Confirm the intent.

**5. Judgement: a pending row may not show a time.**

- `/Users/kristof/Documents/sonrisa-task/src/features/notifications/notification-row.ts:58` shows "Waiting to be sent" when `attempts === 0`, with no time.
- Spec: "A pending row shows its next attempt." This is fine if the design says so.

**Minor:** the plain-text email in `/Users/kristof/Documents/sonrisa-task/src/lib/alerting/channels/email/render.ts:150` has the bare URL without the "View at source" label. Spec: "a 'View at source' link". This is a wording point only.
