# Increment 2: code review

- **Agent:** two `reviewer` agents in parallel, through `mattpocock-skills:code-review` (Standards and Spec axes)
- **Reviewed:** `origin/main...increment-2` at `2439315`, code only (`':!docs'`), 117 files; spec axis against #4 and its design-decisions comment
- **Date:** 2026-11-27 20:20

## Dispositions

### Standards

| #   | Finding                                                    | Severity  | Disposition | Why                                                                                                                                        | Fixed in  |
| --- | ---------------------------------------------------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| S1  | Arbitrary grid value in the source health section          | hard      | accepted    | ui.md forbids arbitrary values in feature code                                                                                             | `01a27c7` |
| S2  | `sendTest` discards the destinations lookup's `error`      | hard      | accepted    | nextjs.md: handle the `error` Supabase returns                                                                                             | `01a27c7` |
| S3  | `removeDestination`'s `name` reaches a message without Zod | hard      | accepted    | CLAUDE.md non-negotiable 4                                                                                                                 | `01a27c7` |
| S4  | Admin queries rely on the page's `requireAdmin()`          | hard      | accepted    | nextjs.md: a query gets the user itself; cheap to add                                                                                      | `01a27c7` |
| S5  | Admin paging copied across three lists                     | judgement | accepted    | One `src/features/admin/paging.ts`                                                                                                         | `01a27c7` |
| S6  | "Email first" sorted in JavaScript, twice                  | judgement | accepted    | supabase.md: filter in the database                                                                                                        | `01a27c7` |
| S7  | `channelType` and `status` typed as `string`               | judgement | accepted    | The closed unions exist                                                                                                                    | `01a27c7` |
| S8  | `finishTest` takes optional positional strings             | judgement | accepted    | Easy to swap; one options object                                                                                                           | `01a27c7` |
| S9  | `<Suspense fallback={null}>` on admin notifications        | judgement | accepted    | ui.md: a skeleton, no layout shift                                                                                                         | `01a27c7` |
| S9b | `<Suspense fallback={null}>` on the add-Slack page         | judgement | rejected    | The page head and copy render at once; the fallback hides only the form during the sign-in check, as the design's "renders at once" allows |           |
| S10 | Admin pages export no `metadata`                           | judgement | rejected    | Deliberate: a static title would reveal the admin area to non-admins (increment 1 UX review, item 3); recorded in the decision log         |           |
| S11 | `href as Route` in the notifications view                  | judgement | accepted    | A typed helper removes it                                                                                                                  | `01a27c7` |

### Spec

| #   | Finding                                                                        | Severity  | Disposition | Why                                                                                                                        | Fixed in  |
| --- | ------------------------------------------------------------------------------ | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- | --------- |
| P1  | The Guardian mapper is tested on a documented shape, not a recording           | hard      | deferred    | No key exists yet; the user records real Guardian and CoinGecko responses before ship (README known limitation until then) |           |
| P2  | No tick-seam test for a permanent Slack failure marking the destination broken | hard      | accepted    | #2 names it under the tick tests                                                                                           | `01a27c7` |
| P3  | `finish_test_send` lets a caller repair their own destination                  | judgement | rejected    | Weighed in the contracts audit (Q4): own destinations only; the tick re-breaks it on the next permanent failure            |           |
| P4  | The database accepts the stub URL in production                                | judgement | rejected    | Contracts audit N1: the app and the tick refuse it before any request                                                      |           |
| P5  | A Slack test without `SLACK_TARGET_KEY` uses a daily test and sends nothing    | judgement | deferred    | A ship step: set the key in Vercel production and Vault (decision log, audit F1)                                           |           |

## Report, verbatim: Standards

Standards review of increment 2 (`git diff origin/main...HEAD -- . ':!docs'`). The migrations follow supabase.md: every SECURITY DEFINER has a written reason, all functions set `search_path = ''`, and revoke/grant are paired. I found no `any`, no `getSession`, no admin client outside the tick, no palette or hex classes and no cross-feature imports.

**Hard violations**

1. `src/features/admin/overview/source-health-section.tsx:9`: `const COLUMNS = "sm:grid-cols-[1.4fr_2fr_0.8fr_0.8fr]";` uses an arbitrary value. ui.md says: "No raw hex colours, no arbitrary values ... in feature code. If a token is missing, that is a design-system change and belongs to the Contracts ticket." Fix: use a scale class such as `sm:grid-cols-4` with col-span, or add a token in Contracts.

2. `src/features/destinations/actions.ts:28-32` (`sendTest`): the `destinations` lookup throws away `error` (`const { data: destination } = ... .maybeSingle()`). nextjs.md says: "Handle the `error` Supabase returns; do not let it become `undefined` data." Fix: destructure `error` and return `FAILED` on it.

3. `src/features/destinations/actions.ts` (`removeDestination(destinationId, name)`): `name` comes from the client and goes into the user-facing message without Zod validation. Only `destinationId` is parsed. CLAUDE.md #4: "Every Server Action ... validates input with Zod." Fix: add `name` to `removeDestinationSchema`, or have `remove_destination` return the name.

4. `src/features/admin/{events,users,notifications,overview}/queries.ts`: no query calls `getCurrentUser()`. They rely on the page's `requireAdmin()` and on RLS or the in-function admin check. nextjs.md: "It gets the user from `getCurrentUser()`". The risk is low because the database enforces it, but the rule is written without exception. Fix: call `requireAdmin()` or `getCurrentUser()` inside each query, or write the exception into the rule.

**Judgement calls**

- **Duplicated Code**: `fetchPage` plus "page past the end falls back to page 1", and the `{ok:true, rows, page, hasNext} | {ok:false}` page type, are copied across `admin/events/queries.ts:21-46`, `admin/users/queries.ts:20-49` and `admin/notifications/queries.ts:16-45`. `parsePage` and `PAGE_SIZE = 25` are defined twice (`admin/events/event-row.ts:11,57`, `admin/users/rows.ts:3,24`), and `notifications-view.tsx:9` reaches into `../users/rows` for its copy. Extract one admin paging module.
- **Repeated Switches**: the "email first" ordering is done in JS twice with different code: `alerts/queries.ts:613` (`emailFirst`) and `destinations/queries.ts:936-939` (two `filter`s). supabase.md says "Filter in the database, not in JavaScript". Sort in SQL instead (`order by channel_type <> 'email', created_at`).
- **Primitive Obsession**: `channelType: string` and `status: string` in `DestinationRow` and `DestinationOption`, and comparisons like `d.status === "broken"`. Use the closed unions from `@/lib/alerting/types`.
- **Long parameter list** (`finishTest`, `actions.ts:693`): `(supabase, id, delivered, error?, brokenReason?)`. Optional positional strings are easy to swap. Pass an options object or the `SendOutcome` itself.
- **Loading state**: `destinations/slack/new/page.tsx:318` and `admin/notifications/page.tsx:77` use `<Suspense fallback={null}>`. ui.md wants "a skeleton ... No layout shift."
- The admin pages export no `metadata` (nextjs.md "Each page exports `metadata`"). This is a deliberate, commented deviation that sets the title inside `AdminFrame`. Record it in an ADR or in the rule so it is not read as an oversight.
- `notifications-view.tsx:31-34`, `href as Route`: this is internal data, so non-negotiable 5 does not apply. Still, a typed `statusHref` returning `Route` would remove the cast.

## Report, verbatim: Spec

Spec review of increment 2 (#4) on `increment-2`. Almost all of #4's criteria and the four design decisions are met: Slack add, hint, limits, test, broken, remove, Block Kit message, news keyword rule, Guardian, CoinGecko, credits, admin tabs, source health, email budget and lists. There are two partial items and three lesser risks.

**(a) Missing or partial**

1. **Hard: the Guardian mapper is not tested on a recorded response.**
   - Spec: "Every source's mapper is unit-tested on recorded responses committed to the repository." #2 says the same.
   - `src/lib/alerting/sources/guardian/map.test.ts:5-6` says the fixture "follows the Content API's documented response shape. It is not a real recording". The fixture is `src/lib/alerting/sources/guardian/search.documented-shape.recorded.json`.
   - Fix: once the Guardian key arrives, record a real response, replace the fixture and drop the caveat. Until then, list it as an open item in ship.

2. **Hard: no test at the tick seam for "a permanent Slack failure marking the destination broken".**
   - #2 names this under its tick tests.
   - `src/lib/alerting/run-tick.dbtest.ts` was not changed in this increment. Its only permanent-failure test (around line 371) is for email.
   - The new `destinationReason` write in `src/lib/alerting/tick/deliver.ts:71-74` is covered only by e2e.
   - Fix: add a `runTick` test where a fake Slack channel returns `broken`. Assert the notification is `failed`, the destination is `broken` with the `destinationReason`, and a later event does not notify it.

**(c) Implemented, but looks risky**

3. **Judgement call: a broken destination can be repaired without a delivered test.** Spec: "A successful test of a broken destination returns it to active."
   - `finish_test_send` (`supabase/migrations/20261127181812_slack_destinations.sql:226-265`) takes `p_delivered` from the caller.
   - A user calling the RPC directly can set their own destination back to active, or broken, without any delivery.
   - This is the security-auditor's area too.

4. **Judgement call: the database accepts the stub URL in every environment.** Spec: "Outside production only, `http://127.0.0.1:<port>/slack/…` is also accepted."
   - The regex in `add_slack_destination` (same migration, line 43) accepts the stub URL in production too.
   - The app's Zod check and the delivery step both refuse it, so nothing is sent, but a direct RPC call can save it.

5. **Judgement call: a Slack test can use up a daily test and send nothing.**
   - `src/features/destinations/actions.ts:85,126`: if `SLACK_TARGET_KEY` is unset, the claim (one of the 5 daily tests) is used and nothing is sent.
   - The user only sees the generic "Couldn't send the test" message.
   - Make sure production has the key.

**(b) Scope creep**

None found. The "Resets at 00:00 UTC" caption, the "Slack · name" label in history and the README SQL all come from the approved designs or from story 67.

**Checked and correct**

- Late thresholds work out to 3, 9 and 15 minutes.
- "Never polled" shows the status Late.
- Failing is driven by `outcome = 'error'`, which matches what the tick stores.
- The removal-lock migration still fails pending notifications with "The Slack destination was removed."
- The real adapters are wired in `collaborators.ts`.
- An unknown `?status=` shows All.
- The CoinGecko 6-hour rule is a trigger, tested in pgTAP.

## Summary

Standards: 4 hard violations and 7 judgement calls; worst, the unvalidated `name` in a Server Action (S3). Spec: 2 partial requirements and 3 risks; worst, no tick-seam test for a permanent Slack failure (P2).
