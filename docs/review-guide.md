# Review guide

The fastest way through this submission. The brief says the process is graded, not the product ("The code is evidence, not the point"), so this guide is organised by **task**: for each piece of work, what was done, what changed, the decisions that mattered, and where the evidence is. Every claim links to the record it comes from.

> **Status:** both increments shipped on 2026-11-27. Production is live; what it does not do yet is listed under [Production check](#production-check).

## Start here

| If you have… | Read                                                                                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10 minutes   | [The product in one paragraph](#the-product-in-one-paragraph), [Key decisions](#key-decisions), [What the AI got wrong and how it was caught](#what-the-ai-got-wrong-and-how-it-was-caught)                                               |
| 30 minutes   | Add [the task summaries](#task-by-task) and one review report with its dispositions: [docs/reviews/2-security-auditor-contracts.md](reviews/2-security-auditor-contracts.md) is the clearest example of a finding that changed the design |
| An hour      | Add [How to review the code](#how-to-review-the-code) and run it locally ([README](../README.md#run-it-locally)), or open the live site with the admin login handed over privately                                                        |
| Everything   | [docs/ai-workflow.md](ai-workflow.md) (the write-up), [decision-log.md](process/decision-log.md) (every decision, 100+ rows), [docs/prompts/](prompts/README.md) (every prompt)                                                           |

## The product in one paragraph

**Heads-up** lets a user say "tell me about _this_, _there_": an alert names a category (news, markets, natural disasters), a minimum severity, optional keywords, and one or more destinations (the account email, and any number of Slack channels). Three real feeds produce events: USGS earthquakes, the Guardian (world, business, environment) and CoinGecko (top 20 coins moving ±3% in an hour). Every minute a scheduled tick polls the feeds that are due, matches new events against alerts, and delivers notifications with limits and retries. Users see their notification history; a broken Slack channel is marked as such. Admins see the whole system read-only (source health, today's email budget, users, events, notifications) and can simulate an event that takes exactly the real path.

- **Live:** https://sonrisa-task.vercel.app (admin login: handed over privately, see [README](../README.md#admin-access))
- **Stack:** Next.js 16 (App Router, Cache Components), Supabase (Postgres with Row Level Security, Auth, `pg_cron`, Vault), Resend, Vercel.

## How the work was organised

The brief is vague on purpose ("something important", "flexible enough", "an admin view"), so the first job was to turn it into decisions, then build in thin slices that each reach production.

```
Brief ──► Grill (questions with options, decided by me) ──► Spec #2 ──► Increments #3, #4
                                                                            │
          for each increment:  Refine ─► Design ─► Slice ─► Contracts ─► Build ─► Review ─► Ship
                               (criteria) (screens) (tickets) (shared,     (parallel  (3 fresh   (deploy,
                                                              serial)      agents)    reviewers)  check live)
```

- **Who decided:** every product decision was mine, from options the agent laid out with a recommendation marked. The agents decided implementation details and wrote them down as theirs. The [decision log](process/decision-log.md) says who decided each row.
- **Branches:** `main` is what is deployed; it changes only by a pull request I approve, merged with a merge commit so each milestone stays visible. A hook refuses commits and pushes to `main`.
- **Models:** Opus 5.5 for planning, review and orchestration; Sonnet 5.5 implementers at medium effort, one per ticket, in parallel git worktrees; Fable 5.2 for design and contracts where the session allowed (where it did not, the log says so).

## Task by task

### 0. Preparing the agent kit (before the task arrived)

- **What was done:** a starter (Next.js 16, Supabase, CI, deploy) and the agent setup: rules per file type, project agents (implementer, reviewer, security auditor, UX reviewer, Next.js advisor), project skills (design, contracts, ship), hooks that run the gates.
- **Key point:** no task-specific code existed before 09:30; `git diff task-received..main` is everything built during the 24 hours.
- **Evidence:** [00-preparation.md](process/00-preparation.md), [.claude/](../.claude/), [CLAUDE.md](../CLAUDE.md).

### 1. Understanding the brief (09:30–11:30)

- **What was done:** a structured grill of the brief in four rounds, two research agents for facts the decisions depended on, then one spec.
- **What it produced:** [spec #2](https://github.com/keserukristof/sonrisa-task/issues/2) (69 user stories, implementation and testing decisions, out of scope), [GLOSSARY.md](../GLOSSARY.md), three ADRs ([docs/adr/](adr/)), [research-01](process/research-01-slack-oauth-vercel-cron.md), [research-02](process/research-02-event-feeds.md).
- **Decisions that shaped everything:**
  - "Something important" = an event a user's alert matches, with severity mapped to one four-level scale per source.
  - Real feeds for all three example categories, polled only in production; simulation for everywhere else.
  - Slack by pasted incoming webhook, after I first chose OAuth and reversed it once research showed the cost (10:44 → 10:57).
  - Email limits that protect the shared quota: 10 per user per hour and 80 per day system-wide (corrected from the agent's first proposal, 11:33).
  - The tick runs inside the same deployable, driven by `pg_cron` ([ADR-0002](adr/0002-background-work-in-the-same-deployable.md), [ADR-0003](adr/0003-pg-cron-drives-the-alerting-tick.md)).

### 2. Planning the increments (11:30–12:30)

- **What was done:** the spec cut into increments ordered by value and risk, with a time checkpoint and a fallback decided in advance.
- **What it produced:** [plan-of-attack.md](process/plan-of-attack.md), increments [#3](https://github.com/keserukristof/sonrisa-task/issues/3), [#4](https://github.com/keserukristof/sonrisa-task/issues/4), [#5](https://github.com/keserukristof/sonrisa-task/issues/5).
- **Key decisions:** the riskiest path (scheduler → tick → outbox → email, with RLS) ships first; simulation rides with increment 1 so the product can be demonstrated on demand; increment 2 _tests_ the extensibility claim by adding a channel and two sources without touching the alerting core.
- **What changed later:** increment 1 ran past the 17:30 checkpoint, so increments 2 and 3 merged as planned (decision log 18:12), with a cut order agreed in advance (CoinGecko, then the admin events list, then source health) for a late Build. Build started at 20:40, well before the 01:00 cut-off, so nothing was cut.

### 3. Increment 1: an email when an earthquake that matters happens

- **Delivers:** sign-up with email confirmation, alerts (create, edit, pause, delete), the account email destination with "Send test", the USGS source, the alerting tick with limits and retries, notification history, admin simulation. Issue [#3](https://github.com/keserukristof/sonrisa-task/issues/3), PR [#16](https://github.com/keserukristof/sonrisa-task/pull/16).
- **Design:** the look ("Instrument room": quiet, nearly colourless, so severity is the loudest thing on a screen) was chosen by me from three directions; 23 artboards approved before any ticket was cut ([docs/design/](design/README.md)).
- **Build:** a Contracts ticket landed the schema, RLS, pgTAP, shared types and route skeletons first ([#15](https://github.com/keserukristof/sonrisa-task/issues/15)); seven implementers then built #7–#13 in parallel, and one built the end-to-end spec #14.
- **Review:** [code review](reviews/1-code-review.md), [security audit of the contracts](reviews/1-security-auditor-contracts.md) (three high findings fixed before any implementer started), [security audit](reviews/1-security-auditor.md), [UX review](reviews/1-ux-reviewer.md) (seven majors fixed, one reviewer diagnosis rejected as wrong).

### 4. Increment 2: Slack, news and markets, and the admin view

- **Delivers:** Slack destinations (add by webhook URL, masked hint, test, broken state, removal with a refusal when an alert would lose its only destination), a Block Kit message, the Guardian and CoinGecko sources, source credits everywhere events are shown, failure reasons that name their channel, the news keyword rule, and the admin area (overview with source health and email budget; users, events and notifications lists with a status filter). Issue [#4](https://github.com/keserukristof/sonrisa-task/issues/4), tickets [#17](https://github.com/keserukristof/sonrisa-task/issues/17)–[#27](https://github.com/keserukristof/sonrisa-task/issues/27).
- **The extensibility claim, checked:** Slack, the Guardian and CoinGecko plug into the `Channel` and `Source` interfaces from increment 1; the alerting core (`src/lib/alerting/run-tick.ts` and `tick/`) changed only to name the channel in two failure sentences and to carry a destination's own broken reason.
- **Design:** 23 new artboards on the existing system; six choices put to me with mockups, the rest delegated to the agent and logged ([README, "Increment 2"](design/README.md#increment-2)). Four rules the design added beyond #4 were confirmed by me and recorded on [#4](https://github.com/keserukristof/sonrisa-task/issues/4#issuecomment-7224886815).
- **Contracts ([#17](https://github.com/keserukristof/sonrisa-task/issues/17)):** five migrations; every write to Slack destinations goes through narrow database functions so the webhook URL is never readable through the API; CoinGecko's "one event per coin per 6 hours" is a database trigger, because a source never touches the database; a local Slack stub for end-to-end tests.
- **Build:** ten implementers in three waves (eight in parallel). Every report was read against its diff before a merge commit; five were corrected by the main session (see below).
- **Review:** [code review](reviews/2-code-review.md) (two axes, 17 findings, 11 fixed), [security audit of the contracts](reviews/2-security-auditor-contracts.md) (one major fixed by design change), [security audit before ship](reviews/2-security-auditor.md) (notes only), UX review: stopped before it reported, by my decision, to ship sooner (its screenshots are kept, `docs/screenshots/2-ux-*`).
- **Ship:** PR [#28](https://github.com/keserukristof/sonrisa-task/pull/28), merged with a merge commit. Production still ran the starter, so increments 1 and 2 went live together: 15 migrations pushed to the cloud database (local and remote match), the app deployed to Vercel. The production check caught a stylesheet problem in Vercel's remote build, fixed by deploying a verified local build (decision log).

## Key decisions

The decisions a reviewer is most likely to question, with who made them. The full list is the [decision log](process/decision-log.md).

| Decision                                                                                        | Who                                      | Why                                                                                                    | Evidence                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Real feeds for news, markets and earthquakes, polled only in production                         | me, overruling the agent                 | The brief names all three; simulation covers every other environment                                   | log 10:44; spec #2                                                                                                       |
| Slack by pasted webhook, not OAuth                                                              | me, reversing my own earlier choice      | Research showed OAuth's cost against a 24-hour window                                                  | log 10:44, 10:57; [research-01](process/research-01-slack-oauth-vercel-cron.md)                                          |
| Two email limits: 10 per user per hour, 80 per day in all                                       | me, accepting the agent's correction     | The provider's daily quota is shared with sign-up confirmations                                        | log 11:33                                                                                                                |
| One deployable; `pg_cron` drives the tick through `pg_net`                                      | me, from the agent's options             | No separate worker to host; the scheduler is in the database                                           | [ADR-0002](adr/0002-background-work-in-the-same-deployable.md), [ADR-0003](adr/0003-pg-cron-drives-the-alerting-tick.md) |
| Row Level Security is the authorization boundary                                                | me (setup)                               | Every table enables RLS in its own migration; pgTAP proves the policies                                | [CLAUDE.md](../CLAUDE.md), `supabase/tests/`                                                                             |
| Increments ordered riskiest-first, merged at a checkpoint, with the cut order agreed in advance | me, choosing between three options       | A late cut is planned, not rushed                                                                      | [plan-of-attack](process/plan-of-attack.md); log 12:22, 18:12                                                            |
| Admin is read-only plus simulation; promotion cut, admin granted by SQL                         | me, accepting the agent's recommendation | A write path with its own audit did not fit the merged increment                                       | log 18:12; spec #2 Out of Scope                                                                                          |
| A news alert needs a keyword                                                                    | me, accepting the agent's recommendation | A keyword-less news alert would notify on every article                                                | log 18:20; #4                                                                                                            |
| A Slack webhook URL never reaches the browser, not even through the API with a stolen session   | agent, after a security finding          | The first design let any session read its own URL for a minute; now a server-only key is also required | [2-security-auditor-contracts.md](reviews/2-security-auditor-contracts.md) F1                                            |
| Merge with merge commits, never squash; `main` only by pull request                             | me                                       | The brief asks for a commit per milestone                                                              | log 10:13; `.claude/hooks/guard-main.mjs`                                                                                |

## What the AI got wrong and how it was caught

The brief puts weight on "the hallucinations or shortcuts you caught". Each item below was caught by a check that did not rely on the agent's own report.

| What the agent did                                                                                                     | How it was caught                                             | What happened                                                                       | Evidence                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Asked grill questions without options                                                                                  | I rejected the format                                         | Round re-asked with lettered options and a marked recommendation                    | log 10:36                                                                     |
| Recommended an email limit that could not protect the shared quota                                                     | The agent's own follow-up check                               | Replaced by two limits                                                              | log 11:33                                                                     |
| Wrote decision-log rows that claimed more than was said or checked                                                     | Read before committing                                        | Four rows rewritten                                                                 | [plan-of-attack](process/plan-of-attack.md#how-ai-output-is-validated)        |
| Schema let one oversized keyword stop matching for every user                                                          | Security audit of the contracts                               | Keyword limits enforced in the database before any implementer started              | [1-security-auditor-contracts.md](reviews/1-security-auditor-contracts.md)    |
| Three implementers' queries did not filter by user, so an admin saw everyone's alerts as their own                     | Reports read against the diff                                 | Rejected and fixed before merging                                                   | log 17:25                                                                     |
| The UX reviewer blamed the wrong library for missing button borders                                                    | The claim was checked in node                                 | Fixed at the real cause                                                             | [1-ux-reviewer.md](reviews/1-ux-reviewer.md) item 1                           |
| `/ship` started a built-in command with the same name                                                                  | Noticed from the skill's own text                             | Stopped before it changed anything; the project skill is now started by path        | log 18:02                                                                     |
| A database function let any holder of a user's session read their Slack webhook URL                                    | Security audit of the increment 2 contracts                   | Redesigned with a server-only key before any implementer used it                    | [2-security-auditor-contracts.md](reviews/2-security-auditor-contracts.md) F1 |
| Demo data reused ids that the database tests use                                                                       | `pnpm db:test` failed                                         | Ids renamed; noted in the commit                                                    | commit `c6afb05`                                                              |
| An implementer sent the Guardian key in an unverified header                                                           | Its own report flagged it; checked against the documented API | Moved to the documented query parameter                                             | commit `544d95b`                                                              |
| An implementer cast a database parameter with `as`, which the rules forbid                                             | Report read against the diff                                  | Fixed at the contract: the function's parameters made optional                      | commit `cc2effe`                                                              |
| An end-to-end spec was flaky; its implementer guessed the stub's keep-alive                                            | The guess was tested: still 2 of 12 failing                   | Real cause found (another test's tick held the claim lease); 16 of 16 after the fix | commit `630ac1a`; log, "Build of increment 2 complete"                        |
| Code review: an unvalidated value in a Server Action, a dropped database error, duplicated paging, a missing tick test | Two fresh reviewers (standards, spec)                         | 11 findings fixed by one implementer, 6 rejected or deferred with reasons           | [2-code-review.md](reviews/2-code-review.md)                                  |

## How to review the code

### Where things live

```
src/app/                    routes only (thin pages; admin pages render nothing until requireAdmin())
src/features/<feature>/     one vertical slice: queries.ts (reads), actions.ts (Server Actions), schema.ts (Zod), components, tests
src/lib/alerting/           the alerting core, framework-free
  types.ts                    Source and Channel interfaces, the vocabulary
  run-tick.ts, tick/          poll → match → limit → deliver, with retries
  sources/{usgs,guardian,coingecko}/   each: index.ts (fetch) + map.ts (pure mapper) + recorded fixtures
  channels/{email,slack}/     each: render (pure) + outcome classification (pure) + send
supabase/migrations/        the schema; every table enables RLS where it is created
supabase/tests/             pgTAP: owner can, other user cannot, anonymous cannot
e2e/                        Playwright, one spec per feature, axe scan on every page
```

### Suggested paths

- **The extensibility claim (15 min):** read `src/lib/alerting/types.ts`, then `channels/slack/` and `sources/coingecko/`, then `git diff origin/main...increment-2 -- src/lib/alerting/run-tick.ts src/lib/alerting/tick/`: the core barely changed.
- **Security (20 min):** `supabase/migrations/` from `20261127181812` on (every function says why it is `security definer`), `supabase/tests/increment_2*.test.sql`, and `src/features/destinations/actions.ts` (how "Send test" reaches the webhook URL without the browser ever holding it).
- **Process (20 min):** pick any ticket, for example [#19](https://github.com/keserukristof/sonrisa-task/issues/19): its body holds the contract and owned paths; follow it to its merge commit, then to the review findings that touched it.
- **Behaviour (15 min):** `e2e/slack-end-to-end.spec.ts` and `e2e/end-to-end.spec.ts` are the two whole-path tests: an admin simulates an event, the tick runs, the user's channel receives it.

### Gates every change passed

| Gate           | What it runs                                            | Where                                           |
| -------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `pnpm verify`  | format, lint, typecheck, unit tests                     | hook before an agent stops; CI on every push    |
| `pnpm db:test` | pgTAP: Row Level Security and database functions        | locally, after each schema change               |
| `pnpm test:db` | the tick against the real local database                | locally                                         |
| `pnpm e2e`     | production build, Playwright on desktop and mobile, axe | locally, before each merge wave and before ship |

## Known limitations

- **The Guardian and CoinGecko mappers are tested on response shapes built from the providers' documentation**, because no keys existed during the build. They are to be re-recorded once the keys exist (code review P1); in production the two sources show as Failing until their keys are set.
- **Promotion and demotion of admins** were cut; admin is granted by SQL ([README](../README.md#admin-access)).
- **A removed Slack destination shows as "Slack · Removed destination"** in history, because its name is not kept after removal.
- **The Slack stub** runs only with the local end-to-end suite; the Slack specs cannot run against a deployment.
- Increment 1's deferred UX items (notices that live in the URL, the expired-link page for a signed-in user) are in [1-ux-reviewer.md](reviews/1-ux-reviewer.md).

## Production check

Checked on https://sonrisa-task.vercel.app after the deploy, with screenshots in `docs/screenshots/2-production-*` (desktop and mobile):

- `/api/health` returns `"status":"ok"` with the database clock.
- The landing, sign-in and sign-up pages render with the approved design; `/admin` signed out shows the not-found page and reveals nothing.
- The scheduled job (`pg_cron`, every minute) reaches the deployed tick route with its secret from Vault, and the tick runs: its first production run (21:15 UTC) polled three sources, stored six real USGS earthquakes and matched them; the Guardian and CoinGecko failed for want of keys, as expected.
- The served stylesheet carries the Heads-up tokens. The first deploy did not: Vercel's remote build served the starter's palette, caught by comparing screenshots and grepping the CSS, and fixed by deploying a verified local build.

**Not working in production yet, and why:**

| What                                                  | Why                                                        | What turns it on                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Email (alerts, tests, sign-up confirmation to others) | No Resend key; Resend's test sender reaches only its owner | A Resend key, and a verified domain for other recipients          |
| The Guardian and CoinGecko                            | No API keys                                                | `GUARDIAN_API_KEY`, `COINGECKO_API_KEY`                           |
| Signed-in flows checked by hand                       | No account could be confirmed without email                | Reviewer accounts created and confirmed in the Supabase dashboard |

Locally, every flow runs end to end, and the e2e suite (98 tests on desktop and mobile) covers them.

## Where everything is

| What                                                | Where                                                  |
| --------------------------------------------------- | ------------------------------------------------------ |
| The brief, verbatim                                 | [process/brief.md](process/brief.md)                   |
| Plan of attack                                      | [process/plan-of-attack.md](process/plan-of-attack.md) |
| Every decision                                      | [process/decision-log.md](process/decision-log.md)     |
| Every prompt and subagent brief                     | [prompts/](prompts/README.md)                          |
| Spec, increments and tickets                        | [issues/](issues/README.md) (exported from GitHub)     |
| Design                                              | [design/](design/README.md)                            |
| Reviews with dispositions                           | [reviews/](reviews/README.md)                          |
| Session handovers (how work moved between sessions) | [process/handover-01…05](process/)                     |
| The write-up                                        | [ai-workflow.md](ai-workflow.md)                       |
