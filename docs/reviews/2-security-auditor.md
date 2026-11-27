# Increment 2: security audit before ship

- **Agent:** security-auditor
- **Reviewed:** `origin/main...increment-2`, started at `2439315`, re-read at `01a27c7` after the code-review fixes
- **Date:** 2026-11-27 21:15

## Dispositions

| #   | Finding                                                          | Severity | Disposition | Why                                                                                                          | Fixed in    |
| --- | ---------------------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| 1   | Slack's raw response body logged in full when a send is not sent | note     | accepted    | Cheap: the log keeps the first 200 characters                                                                | this commit |
| 2   | The Guardian key travels in the query string                     | note     | rejected    | It is the documented way; the auditor checked no log, error or table can capture the URL                     |             |
| 3   | Admin Client Components exist as public static chunks            | note     | rejected    | They reveal no data or capability; every admin read and action is gated by `requireAdmin()` and `is_admin()` |             |

**Verdict:** no blocker, major or minor. Increment 2 can ship.

## Report, verbatim

## Security audit: increment 2 (#4), branch `increment-2`

**What I audited.** I started on `2439315`. During the audit the fix implementer merged the code-review fixes (`0ba03e1`, `7677c66`, `ee23ddd`, `c81a66c`, merge `01a27c7`), so I re-read the files they touched at `01a27c7`. Line numbers below are from `01a27c7`. The working tree matches the branch, except for the untracked `docs/reviews/2-code-review.md`.

**Checks run, all read-only:**

- `pnpm db:test` passes: 6 files, 120 tests.
- SELECTs on the local database: `proacl` and `prosecdef` of every new function, column grants on `destinations` and `events`, policies on `destinations`, `test_sends` and `source_polls`.
- A throwaway `node -e` fetch, to see what fetch error messages contain.
- A grep of the existing `.next` build. It is from the e2e run at 21:01, so it predates `01a27c7`.

I did not re-raise F1 to F4 or N1 to N3.

### Findings

There are no blockers, majors or minors. These are notes only:

- **note**, `src/lib/alerting/channels/slack/index.ts:56`
  - Slack's raw response body is logged in full whenever a send is not `sent`.
  - It carries no secret: the URL is never logged, and Slack's body is a short code or an HTML error page. The only cost is log noise if Slack returns a large 5xx page.
  - Optional fix: log `body?.slice(0, 200)`.

- **note**, `src/lib/alerting/sources/guardian/index.ts:33`
  - The Guardian key travels in the `api-key` query string, as the API documents, so anything that logs outbound URLs would capture it.
  - I checked the places it could surface, and none does:
    - `next.config.ts` has no `logging.fetches`.
    - The thrown errors carry only the status.
    - I tried a bad port, an unknown host and a timeout. The messages were only "fetch failed" or "The operation was aborted due to timeout", never the URL. `poll.ts` stores `error.message` only.
    - `source_polls` is readable by admins only (policy `is_admin()`).
  - No action needed. If you want belt and braces, keep an eye on any future fetch logging.

- **note**, `src/features/admin/simulate-form.tsx` and `src/features/admin/overview/retry-button.tsx`
  - These Client Components exist as public static chunks, as every route's chunks do.
  - Someone who downloads and reads the chunk files could learn that an admin area exists. They gain no data and no capability: every admin read and action is gated by `requireAdmin()` and `is_admin()`.
  - No fix proportionate to a 24-hour build.

### Checked and sound

**Destinations actions** (`src/features/destinations/actions.ts`):

- `sendTest`, `addSlackDestination` and `removeDestination` each call `getCurrentUser()` first and validate with Zod (`z.uuid()`; name trimmed, 1 to 60 characters).
- `removeDestination` now also validates the echoed `name` (`7677c66`).
- Ownership is enforced in the definer functions: `claim_test_send`, `slack_test_target` and `remove_destination` all check `auth.uid()`. An admin can read others' destinations through RLS but cannot claim a test on them.
- The webhook URL reaches the client nowhere:
  - Action results carry only our own sentences.
  - `addSlackFailure` uses `error.message` only to compare against a known code.
  - Nothing logs the URL.
  - `listDestinations` never selects `settings`, and the column is not granted. Only `hint` (the last 4 characters) is shown.
- `SLACK_TARGET_KEY` is read only in `actions.ts:132` through `serverEnv()` (`server-only`). It has no `NEXT_PUBLIC_` name and is never returned or logged.
- A URL that fails `slackSettingsSchema` is finished with `SLACK_INVALID_URL_REASON` and nothing is sent. If the key or URL is missing, the test is finished as failed.
- Redirects go to fixed `withNotice("/destinations", …)` targets.

**Alerts actions** (`src/features/alerts/actions.ts`):

- The change only maps `23514` plus the constraint name to our own sentence.
- The auth check and Zod validation are unchanged, and no database message reaches the user.

**Slack channel** (`src/lib/alerting/channels/slack/`):

- Every stored URL is re-validated before the request.
- The production pattern accepts only `https://hooks.slack.com/services/[\w/-]+`, and the stub only when `allowsLocalSlackStub()` holds.
- Requests use `redirect: "error"` and a 10-second timeout.
- Caught errors are logged by `error.name` only.
- Slack's answer text is never stored. `classifySlackResponse` maps it to our own sentences.
- In `render.ts`, the title, summary and alert name are escaped (`&`, `<`, `>`) in both the blocks and the fallback `text`. So `<!channel>`, `<@U…>` and link injection are impossible.
- Event URLs have `|`, `<` and `>` percent-encoded inside `<url|text>`.
- Unescaped `*`, `_` and `~` can only change formatting.

**Guardian and CoinGecko:**

- Responses are parsed with Zod per item, and bad items are skipped.
- Guardian HTML is stripped to text, and Guardian URLs are kept only if `http(s)`. The CoinGecko URL is built with `encodeURIComponent`.
- CoinGecko's key goes in a header. Neither key is logged or stored.
- `raw` is readable by every signed-in user, as before. I checked Guardian's recorded shape: it carries no key (`apiUrl` has none).

**Admin pages** (`src/app/(app)/admin/**`, `src/features/admin/**`):

- Every page renders an empty `AdminFrameFallback` and calls `requireAdmin()` inside `<Suspense>` before the frame, the title or the tabs render. There is no static `metadata` export.
- The prerendered `.next/server/app/admin*.html` files contain only `<title>Heads-up</title>` and no tabs or admin copy.
- Since `0ba03e1`, every admin query also calls `requireAdmin()`.
- The admin RPCs are `security invoker` and filtered by `is_admin()`. They are granted to `authenticated` only, not `anon`, and the grants carried over through the `create or replace` in `20261127194716`.
- What the lists expose:
  - Users: email, role, sign-up date and alert count.
  - Notifications: title, time, owner email, channel, attempts, status and detail.
  - Failure text is shown only if it matches our own sentence pattern.
  - Events: only the columns the list displays.
- I compared these with the column lists in the code and the design notes, not against the #4 issue text itself.

**History and email rendering:**

- The notification history shows `last_error` only if it matches `^The (email|Slack) …\.$`. Otherwise it shows a generic sentence.
- Broken reasons and titles are rendered by React as text.
- The email footer credit comes from the catalog and passes through `esc()`. The subject is a header, not HTML.

**e2e:**

- Nothing in `src` imports `e2e/support/slack-stub.mjs`; Playwright starts it, bound to 127.0.0.1.
- The only client chunk that mentions Slack has just the `hooks.slack.com` placeholder.
- The specs that use `SUPABASE_SECRET_KEY` live under `e2e/`, which the Next build does not include.
- `src/lib/alerting/testing/fixtures.ts`, which reads the secret key from `process.env`, is imported only by `run-tick.dbtest.ts`.
- I found no literal keys in `e2e/`, `scripts/`, `supabase/` or `.env.example`.

**Secret key:** `createAdminClient` is still imported only by `src/app/api/tick/route.ts`.

### Verdict

Increment 2 can ship as `increment-2` stands at `01a27c7`. I found no path for one user to read or change another user's data. Nothing of the Slack URL, `SLACK_TARGET_KEY` or the source API keys reaches a browser, log or table. Nothing of the admin area renders for a non-admin.
