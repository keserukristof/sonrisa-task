# Handover: start of phase 1 (Understand)

Written 2026-11-27 10:28 at the end of the first task session, for the session that runs the grill. Read this, then `CLAUDE.md`, then [brief.md](brief.md).

## Where things stand

- **Branch:** `spec`, cut from `main` at `a80efef`. Phases 1 and 2 commit here and reach `main` through one pull request before increment 1 starts.
- **`main`:** CI green. Holds the starter, the agent kit, the evidence setup and the branch rules. Tag `task-received` marks the last commit before the task.
- **Live:** https://sonrisa-task.vercel.app runs the starter only.
- **Local:** Supabase runs in Docker (lite mode: db, rest, auth, kong, mail catcher). Port 3000 may be taken by another project; e2e uses its own port.
- **Issues:** none yet. The spec is the first.

## What was done in the first session (09:43 to 10:28)

1. Assessed the kit against the brief. The brief grades the process, not the product, and the kit captured almost none of it. See the decision log.
2. Built evidence capture: [decision-log.md](decision-log.md), [docs/prompts/](../prompts/README.md) (from 09:30 on; preparation prompts left out by choice), [docs/issues/](../issues/README.md), [docs/reviews/](../reviews/README.md), [docs/screenshots/](../screenshots/README.md), [00-preparation.md](00-preparation.md). `pnpm evidence:export` regenerates prompts and issues.
3. Branch rules: product work on branches, `main` only through pull requests with merge commits. `.claude/hooks/guard-main.mjs` refuses agent commits and pushes to `main` ([keserukristof/sonrisa-task#1](https://github.com/keserukristof/sonrisa-task/pull/1)).
4. Checked the stack against the brief and compared it with adding a NestJS backend. The recommendation is to keep Next.js plus Supabase; the decision is the grill's to confirm (below).

## Next step

The user types `/grill-with-docs` on the brief (Opus 5.5). Then `/to-spec`, then the increments, then the plan of attack. Target: done by 12:15.

## What the grill must settle

The brief leaves these open on purpose. Each answer goes into the glossary, an ADR or the spec.

1. **Event source:** real feeds (USGS earthquakes needs no key; news and market APIs need keys and have free-tier limits), simulated events, or one real feed plus simulation. Recommended: one real feed plus a "simulate event" action in the admin view, so reviewers can trigger an alert end to end in seconds.
2. **What "important" means:** thresholds the user sets, events the admin curates, or the source's own severity.
3. **What an alert is:** category, keywords, region, severity, and how often it may fire.
4. **Slack:** incoming webhooks (simple, fits the day) or a Slack app with OAuth.
5. **Email in production:** a provider such as Resend. The user must create the account and key.
6. **Admin view:** what an admin sees and can do: users, alerts, events, the delivery log, simulating events.
7. **Architecture ADRs to record:**
   - **Stack:** stay with Next.js only, no NestJS. Revisit when delivery volume outgrows a batch per minute, a second client needs a public API, separate teams own backend and frontend, or the company standard is Nest.
   - **Scheduler:** Supabase pg_cron with pg_net calls a Next.js Route Handler every minute. Vercel Hobby schedules are too coarse (daily for legacy Cron Jobs, 15 minutes at best for Schedules). The route gets its own narrow secret, never the Supabase secret key, because pg_net requests sit readable in a queue.
   - **Outbox:** a `notifications` table with status and attempts gives retries, idempotency and the admin's delivery log.
   - **Channels:** one `Channel` interface, one adapter per channel, per-channel settings in a Zod schema keyed on channel type. The alerting core imports nothing from `next/*`, so it could move to a worker later.

## Gaps in the starter that the first Contracts ticket closes

- `src/lib/env.ts` validates only public variables; it needs a server-only schema (email key, cron secret, feed keys).
- `src/lib/supabase/admin.ts` with the secret key, for the cron route only.
- Slack webhook URLs are secrets: behind RLS, ideally in Supabase Vault, never sent to the browser.
- An admin role enforced in RLS, with pgTAP tests.
- Unverified: whether pg_net works under `pnpm bootstrap --lite`. Check before relying on it.

## Plan for the day

| Target      | Step                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| 10:30–12:15 | Grill, spec, increments, plan of attack, `spec` pull request merged                                       |
| 12:15–16:00 | Increment 1, most valuable flow (likely: create an alert, receive an email when a matching event arrives) |
| 16:00–19:30 | Increment 2 (likely: Slack, a real feed, a second channel proving the interface)                          |
| 19:30–22:30 | Increment 3 (likely: the admin view)                                                                      |
| 22:30–23:30 | Final write-up, README, evidence export, reviewer access                                                  |

If increment 1 runs past 16:30, merge increments 2 and 3 into one smaller one. Scope freeze is 05:30 tomorrow; the deadline is 09:30.

## Only the user can

- Type `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement-spec` and `/ship`, and switch models with `/model`.
- Approve designs, merges, cloud database pushes and deploys.
- Create the email provider key (before increment 1 ships) and the Slack webhook (before increment 2).
- Decide how reviewers get access to the private repo, and optionally turn on branch protection for `main`.

## Practical notes for the next session

- Log every decision, rejection and course correction in [decision-log.md](decision-log.md) when it happens. It is the evidence the brief weighs most.
- Run `pnpm evidence:export` before each push, and read new prompts for personal data.
- The shell cannot read `~/Downloads` on this machine; the Terminal panel tool can.
- Stage specific paths, never `git add -A`: other sessions may edit this repo.
- The user writes in English during the task; prompts are part of the submission.
