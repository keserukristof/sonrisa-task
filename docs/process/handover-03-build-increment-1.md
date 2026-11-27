# Handover: build of increment 1

Written 2026-11-27 16:45 at the end of the session that ran Refine, Design, Slice and Contracts for increment 1, for the session that runs Build, Review and Ship. Read this, then `CLAUDE.md`, then the increment issue [#3](https://github.com/keserukristof/sonrisa-task/issues/3) and the tickets under it.

## Before anything else

**The setup script has run.** The user ran `node scripts/local-env.mjs` on 2026-11-27 at about 16:47. Checked right after: the local database's Vault holds both `tick_url` and `tick_secret`, and the scheduler's job is active with its last three runs succeeded.

- **What it did:** added `TICK_SECRET` and `APP_URL` to `.env.local`, and stored the local scheduler's URL and secret in the local database. Agents may not read or edit `.env.local`, so no agent can run it or look inside the file.
- **Why it mattered first:** each implementer's worktree copies `.env.local` when it is created. A worktree made before the script ran would have no tick secret, and the tick route (#9) and the end-to-end ticket (#14) would fail in it.
- **When it must run again:** after any database reset, which empties the Vault. Ask the user; do not run it.
- **How to check without reading the file:** `select name from vault.secrets where name in ('tick_url', 'tick_secret')` in the local database returns two rows.

## Where things stand

- **Branch:** `increment-1`, pushed, clean, at `cd67f18` when this was written. It reaches `main` through one pull request in `/ship`.
- **Live:** https://sonrisa-task.vercel.app still runs the starter.
- **Done for increment 1:** Refine, Design, Slice, Contracts. Each has a line in [docs/ai-workflow.md](../ai-workflow.md).
- **Closed:** [#15](https://github.com/keserukristof/sonrisa-task/issues/15) Contracts.
- **Open tickets**, all sub-issues of #3:

  | Ticket                                                         | Title                                          | Blocked by        |
  | -------------------------------------------------------------- | ---------------------------------------------- | ----------------- |
  | [#7](https://github.com/keserukristof/sonrisa-task/issues/7)   | Sign up, confirm and sign in                   | nothing           |
  | [#8](https://github.com/keserukristof/sonrisa-task/issues/8)   | Manage alerts                                  | nothing           |
  | [#9](https://github.com/keserukristof/sonrisa-task/issues/9)   | Alerting tick: poll, match, limit, deliver     | nothing           |
  | [#10](https://github.com/keserukristof/sonrisa-task/issues/10) | USGS earthquake source                         | nothing           |
  | [#11](https://github.com/keserukristof/sonrisa-task/issues/11) | Email channel and send test                    | nothing           |
  | [#12](https://github.com/keserukristof/sonrisa-task/issues/12) | Notification history                           | nothing           |
  | [#13](https://github.com/keserukristof/sonrisa-task/issues/13) | Simulate an event                              | nothing           |
  | [#14](https://github.com/keserukristof/sonrisa-task/issues/14) | End to end: a simulated event arrives by email | #9, #10, #11, #13 |

  Each ticket body ends with "Contracts already in place" and "Owned paths". An implementer edits nothing outside its owned paths.

- **Checks on `increment-1` when this was written:** `pnpm verify` green (38 unit tests), `pnpm build` green, `pnpm db:test` green (74 pgTAP checks), `pnpm e2e` green (20 tests, four runs in a row).
- **CI has not run on this branch.** It runs on pull requests only. The first run happens when `/ship` opens the pull request, and it includes steps this session added (`pnpm db:test`, `pnpm test:db`) that have never run in CI.
- **Local stack:** Supabase runs in Docker in lite mode, with confirmation on, the mail catcher on 54324 (web) and 54325 (SMTP).

## The schedule

- It was 16:45 when this was written. The plan of attack's target for increment 1 was 17:00.
- **The 17:30 checkpoint will pass during the build, so increments 2 and 3 merge into one smaller increment.** That was decided in the grill and is in the [plan of attack](plan-of-attack.md). What the merged increment drops is not decided yet: put it to the user when increment 1 has shipped, as a grill with options.
- Scope freezes at 05:30 on 2026-11-28. The deadline is 09:30.

## Next steps, in order

| #   | Step                            | How                                                                                                  | Model      |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Confirm the setup script ran    | Done: see above. Check the two Vault rows are still there                                            |            |
| 2   | Confirm the testing arrangement | Ask the user (see the next section)                                                                  |            |
| 3   | **Build** #7 to #13 in parallel | The user types `/mattpocock-skills:implement-spec #3`; one `implementer` per ticket, in its worktree | Sonnet 5.5 |
| 4   | Merge the seven branches        | Into `increment-1`, with merge commits; check each report against its diff before merging            |            |
| 5   | **Build** #14                   | One `implementer`, after #9, #10, #11 and #13 are merged                                             | Sonnet 5.5 |
| 6   | Run everything once             | `pnpm verify`, `pnpm build`, `pnpm db:test`, `pnpm test:db`, `pnpm e2e` (both browsers)              |            |
| 7   | **Review**                      | `/mattpocock-skills:code-review`, `security-auditor` and `ux-reviewer`, started together             | Opus 5.5   |
| 8   | **Ship**                        | The user types `/ship`                                                                               | Fable 5.2  |

The session that runs `/implement-spec` starts the implementers itself, as sub-agents. An implementer cannot start sub-agents of its own.

## Models and effort

The user asked for this explicitly on 2026-11-27, so it holds for the build whatever the kit's tables say:

- **Implementers run on Sonnet 5.5 at medium effort, whatever model the main session uses.**
  - The model comes from the agent definition: `.claude/agents/implementer.md` has `model: claude-sonnet-5-5`. A sub-agent takes its model from there, not from the session that starts it, so a main session on Opus 5.5 still gets Sonnet 5.5 implementers.
  - The effort does not come from the definition, which sets none. Pass `effort: "medium"` on every Agent call that starts an implementer. That parameter is only for cases where the user asked for a level, and here they did.
- **The main session runs at medium effort too.** The user sets that themselves, with the model and effort picker of the session; ask them to confirm it is set before the build starts.
- The review agents (`reviewer`, `security-auditor`, `ux-reviewer`) keep the models in their definitions, Opus 5.5. The user said nothing about their effort: do not pass one.

## The testing arrangement (proposed, not yet confirmed)

The user asked how to make the build as fast as possible, and whether tests could be skipped and run once at the end. The previous session proposed the arrangement below. **The user has not said yes to it. Ask before briefing the implementers**, and log the answer.

- **During a ticket:** unit tests and `pnpm typecheck` only. The implementer writes its Playwright spec, and runs it once, on desktop Chromium only (`pnpm e2e e2e/<feature>.spec.ts --project=chromium`), before it reports.
- **After the merge:** the main session runs the full suite once, on both browsers, with the accessibility scans, plus `pnpm test:db` and `pnpm db:test`.
- **Not skipped:**
  - Writing the tests. A failure in the final run with no tests behind it is seven tickets of code to search.
  - The tick's integration tests in #9 (`*.dbtest.ts`, `pnpm test:db`). They run in seconds and cover the rules most likely to be wrong.
  - Test-first on the pure logic of #9, #10 and #11.
- **Why not skip more:** "never weaken, skip or delete a test to get green" is non-negotiable 7 in `CLAUDE.md`, and the reviewers read it.

If the user confirms, the arrangement goes into each implementer's brief. It needs no change to the kit.

## What was decided in the previous session

The full record is [decision-log.md](decision-log.md). The parts a builder needs:

- **The product is called Heads-up.** Every time is shown in UTC with the label. Feedback is an inline notice; there are no toasts.
- **Acceptance criteria** are in #3, from three grill rounds. Screens, copy and states are in [docs/design/](../design/README.md): one file per screen under `screens/`, with a screenshot of each artboard.
- **Four choices differ from the original spec**, confirmed by the user and now written into #2 and #3:
  - The `net` schema is not restricted, because a migration cannot do it. The API not exposing it is the protection, checked by `e2e/smoke.spec.ts`.
  - The tick URL and secret are in Supabase Vault.
  - Matching with limits, and claiming notifications for delivery, are SQL functions (`tick_match_events`, `tick_claim_notifications`). The tick ticket calls them; it does not reimplement them.
  - New limits from the security audit: 3 test sends per account per UTC day, 20 test sends a day in all, 50 alerts per account.
- **The security audit of Contracts** found three serious problems, all fixed: [1-security-auditor-contracts.md](../reviews/1-security-auditor-contracts.md).

## Things the implementers will trip over

- **The database is shared, and the tick is global.** A tick run by one ticket's test matches every unmatched event and claims every due notification, other tickets' and the seed's included. Each ticket's body says how to stay isolated: own users from `createUser()`, a far-future clock per test in #9, assertions only on own rows, fake channels that answer `sent` by default.
- **Emails count toward one shared daily limit of 80.** Tests that send email delete their account in teardown with `deleteUser()`, which frees its share.
- **No implementer runs `pnpm db:reset`, adds a migration, a dependency or a primitive, or edits `src/components/ui/` or `globals.css`.** If one needs any of these, it stops and reports the missing contract, and the main session fixes it once.
- **The main session cannot run `pnpm db:reset` either:** it ends by running `scripts/local-env.mjs`, which edits `.env.local`. If the schema must change, run `pnpm exec supabase db reset`, then `node scripts/seed-local.mjs`, then ask the user to run `node scripts/local-env.mjs` again, because a reset empties the Vault.
- **Demo accounts** exist only locally, loaded by `scripts/seed-local.mjs`: `demo@heads-up.test` and `admin@heads-up.test`. Their passwords are in `supabase/local/demo-data.sql`. `supabase/seed.sql` creates nothing, on purpose.
- **Accessibility scans** wait for the page title before running, because the title streams in after a navigation. The suite runs with reduced motion.
- **`e2e/contracts.spec.ts`** belongs to the main session. No ticket edits it. It checks what every ticket builds on: the sign-up plumbing, the test helpers and the app shell.

## Left for the main session after the merge

- Delete `src/components/placeholder.tsx` once no page uses it. No ticket owns it.
- Save every implementer report that was not accepted as it stood in `docs/reviews/`, as `1-implementer-<ticket>.md`.
- Save the three review reports verbatim in `docs/reviews/`, with a disposition for each finding.
- Add the Build and Review lines to `docs/ai-workflow.md`.

## Not verified yet

- **The scheduler in the hosted Supabase project.** Only the local stack was checked. In particular, nobody has verified that the hosted project lets the scheduled job read Vault as the `postgres` role. Check Supabase's documentation before `/ship`, not during it.
- **`scripts/local-env.mjs` has never been run by an agent.** It parses (`node --check`), and `pnpm bootstrap` calls it, CI's included.
- **The Slack and feed points the research marked unverified**, in [research-01](research-01-slack-oauth-vercel-cron.md) and [research-02](research-02-event-feeds.md). Increment 1 uses only USGS.

## For `/ship`

Steps the hosted project needs that the local one already has:

- **Vault:** two secrets, `tick_url` (the deployed `/api/tick`) and `tick_secret` (the same value as the deployment's `TICK_SECRET`). The scheduled job does nothing until both exist.
- **Auth:** email confirmation on; minimum password length 8; the confirmation email template from `supabase/templates/confirmation.html` with the subject "Confirm your Heads-up account"; Resend's SMTP credentials.
- **Redirect allow-list:** the exact production origin only. No wildcard: the confirmation link is built from the redirect the sign-up request names, so a wildcard could send a token to another site.
- **Privileges:** run the audit's privilege query against the hosted project, and confirm the API does not expose the `net` schema and that GraphQL does not reflect it.
- **Environment in Vercel:** `SUPABASE_SECRET_KEY`, `TICK_SECRET`, `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `REAL_POLLING=true`.
- **No seed for production.** The admin is granted by SQL, and reviewers get a login privately.
- **Evidence:** a screenshot of a simulated event's email arriving in production.

## Only the user can

- **Run** `node scripts/local-env.mjs`, and anything else that touches `.env.local`.
- **Type the commands:** `/mattpocock-skills:implement-spec` and `/ship`, and switch models with `/model`.
- **Approve:** merges, cloud database pushes and deploys.
- **Create before increment 1 ships:** the Resend account, the verified sending domain with its DNS records, the API key, and the Resend SMTP credentials in Supabase Auth. These were asked for at 12:40 and again at 15:30; ask where they stand.
- **In production:** make their own account admin by SQL, and hand reviewers an admin login privately.

## Practical notes

- **Log as it happens.** Every decision, rejection and correction goes into [decision-log.md](decision-log.md) when it happens. Write only what the user actually said; when they give no reason, write "No reason given". Never write a claim in the user's voice that they did not make.
- **Questions to the user** list lettered options with the recommended one marked, and use a visual wherever a picture makes the choice clearer.
- **Agent claims are beliefs.** Check an implementer's report against its diff and a test run before accepting it.
- **Evidence export.** Run `pnpm evidence:export` after any phase that creates or changes issues, and before each push. Read the new prompts for personal data.
- **Staging.** Stage specific paths, never `git add -A` at the repository root.
- **Shell.** The shell is zsh: arrays start at 1. A publish script in this session assumed 0 and mislabelled eight issues.
- **Guards.** Two commands were refused in this session, one that edited `.env.local` and one that would have read the local JWT secret. Both refusals were right. When a guard fires, find another way or ask the user; do not work around it.
