# Handover: start of increment 1

Written 2026-11-27 12:40 at the end of the phase 1 and 2 session, for the session that runs increment 1. Read this, then `CLAUDE.md`, then the increment issue [#3](https://github.com/keserukristof/ai-task/issues/3) and the spec [#2](https://github.com/keserukristof/ai-task/issues/2).

## Where things stand

- **`main`:** the starter, the agent kit and the phase 1 and 2 output, merged from `spec` by [keserukristof/sonrisa-task#6](https://github.com/keserukristof/ai-task/pull/6). No application code for the brief yet.
- **Branch:** `increment-1`, cut from that `main`. It holds only this handover. Every phase of increment 1 commits there, and it reaches `main` through one pull request in `/ship`.
- **Live:** https://sonrisa-task.vercel.app still runs the starter only.
- **Issues:**
  - Spec [#2](https://github.com/keserukristof/ai-task/issues/2): 69 user stories, implementation and testing decisions, Out of Scope.
  - Increments [#3](https://github.com/keserukristof/ai-task/issues/3), [#4](https://github.com/keserukristof/ai-task/issues/4) and [#5](https://github.com/keserukristof/ai-task/issues/5), each a sub-issue of the spec and blocked by the one before. Each lists its stories. Acceptance criteria are empty until its Refine phase.
- **Local:** Supabase runs in Docker in lite mode. `pg_cron` and `pg_net` are available but not installed; the grill's checks installed them and dropped them again.

## What was decided (the short version)

The full record is [decision-log.md](decision-log.md), with the vocabulary in [GLOSSARY.md](../../GLOSSARY.md) and two ADRs: [0002](../adr/0002-background-work-in-the-same-deployable.md) and [0003](../adr/0003-pg-cron-drives-the-alerting-tick.md).

- **Users and roles.**
  - One person per account, signing up with email and password; the address is confirmed at sign-up, and there is no password reset.
  - An admin promotes and demotes other users, never themselves. The first admin is granted by SQL.
- **Sources.** Each source has its own feed and floor:
  - USGS earthquakes, magnitude 4.5 and above, polled every minute.
  - The Guardian, world, business and environment sections, every 3 minutes, all at severity low.
  - CoinGecko, the top 20 coins, every 5 minutes. A market event is a 1-hour change crossing ±3%, at most once per coin per 6 hours.

  Only production polls real sources.

- **Alert rule.** An alert has a category, a minimum severity on four levels (none for news), optional keywords, and one or more destinations. It matches only events that arrive after it was created.
- **Channels.**
  - Email goes only to the account's own address, through Resend with a verified domain.
  - Slack uses incoming webhooks the user pastes, with URLs never readable in the browser.
- **Limits and retries.**
  - Email is capped at 10 per user per hour and 80 a day across the system. Over a cap, the notification is recorded as skipped.
  - A failed send is retried at 1, 5 and 15 minutes, then marked failed. A Slack webhook reported gone is marked broken.
- **Architecture.**
  - Next.js and Supabase only.
  - `pg_cron` calls a tick route every minute through `pg_net`, with a narrow tick secret.
  - One `runTick` function is the alerting core and the main test seam, with fake sources, fake channels and a fake clock over the real local database.
- **Admin.** Mostly read-only lists, plus promotion and simulated events. Simulation is in increment 1, because without it nobody can see an alert fire on demand.

## Next steps, in order

| #   | Step                                                                                        | How                                                                                                     | Model      |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | **Refine** increment 1: a ten-minute grill of #3, acceptance criteria written into its body | `mattpocock-skills:grilling` on [#3](https://github.com/keserukristof/ai-task/issues/3)                 | Opus 5.5   |
| 2   | **Design** the increment's screens, and the design system on this first run                 | `/design`, approved by the user, exported into `docs/design/`                                           | Fable 5.2  |
| 3   | **Slice** into tickets, ticket 1 is Contracts                                               | the user types `/mattpocock-skills:to-tickets #3`                                                       | Opus 5.5   |
| 4   | **Contracts**: schema with RLS, pgTAP, types, Zod schemas, routes, env schema, admin client | `/contracts`, serial, then `security-auditor`; consult `nextjs-advisor` for routing and caching         | Fable 5.2  |
| 5   | **Build** the remaining tickets in parallel                                                 | the user types `/mattpocock-skills:implement-spec #3`                                                   | Sonnet 5.5 |
| 6   | **Review**                                                                                  | `/mattpocock-skills:code-review`, `security-auditor`, `ux-reviewer`; reports saved in `docs/reviews/`   | Opus 5.5   |
| 7   | **Ship**                                                                                    | the user types `/ship`; check in production that a simulated event delivers an email, with a screenshot | Fable 5.2  |

Target: increment 1 shipped by 17:00. **If it runs past 17:30, increments 2 and 3 merge into one smaller increment**: decided in the grill and recorded in the [plan of attack](plan-of-attack.md).

## Questions for the Refine grill

These are left open on purpose; the spec fixes the rules but not these details.

- **The email notification.** Its subject and content, and how a simulated event is marked in it.
- **Sign-up while waiting for confirmation.** What the page shows, and whether "resend confirmation" exists. It would draw on the 20 confirmation emails a day.
- **Alert form.**
  - Are keywords free text split on commas?
  - Is there a maximum number of keywords?
  - What happens to keywords when the category changes?
- **Notification history.** Pagination size, and whether it can be filtered.
- **Simulate form.** Its fields and defaults, and whether it lets the admin pick a source.
- **What a reviewer sees on first sign-in**, with no alerts.

## Gaps the Contracts ticket closes

- `src/lib/env.ts` validates only public variables. It needs a server-only schema for these variables:
  - Supabase secret key
  - tick secret
  - Resend key and sender address
  - Guardian key
  - CoinGecko key
  - the real-polling flag
- `src/lib/supabase/admin.ts` with the secret key, used by the tick route only.
- **The migration that enables `pg_net` must restrict the `net` schema.** Locally, `anon` and `authenticated` have usage on it and can select from its request queue, which stores headers (ADR-0003).
- **The first pgTAP tests.** There is no `supabase/tests/` yet.
- **Recorded sample responses** from USGS for the mapper tests and for local development. Real polling is off outside production.
- **Local email.** It goes to the local mail catcher over SMTP; check its SMTP port in `supabase/config.jsonc` (the web UI is on 54324).

## Not verified yet

- **The scheduler against the hosted Supabase project and the deployed route.** Only the local stack was checked. Check it at the first ship.
- **The Slack and feed points the research marked unverified.** They are listed in [research-01](research-01-slack-oauth-vercel-cron.md) and [research-02](research-02-event-feeds.md). Do not build on them without checking.

## Only the user can

- **Type the commands:** `/mattpocock-skills:to-tickets`, `/mattpocock-skills:implement-spec` and `/ship`, and switch models with `/model`.
- **Approve:** designs, merges, cloud database pushes, seeding the cloud database, and deploys.
- **Create these before increment 1 ships:**
  - the Resend account, the verified sending domain with its DNS records, and the API key;
  - the Resend SMTP credentials set in Supabase Auth, so confirmation emails can reach any address.

  They go into the Vercel and Supabase environments, never into the repository or the chat. Start the DNS now; verification time is unpredictable.

- **Before increment 2:** a Guardian developer key, a CoinGecko Demo key, and one Slack incoming webhook.
- **In production:** make their own account admin by SQL, and hand reviewers an admin login privately.

## Practical notes

- **Log as it happens.** Every decision, rejection and correction goes into [decision-log.md](decision-log.md) when it happens. Write only what the user actually said; when they give no reason, write "No reason given".
- **Grill format.** Questions list lettered options and mark the recommended one; never only a recommendation.
- **Agent claims are beliefs.** Treat facts stated by an agent (vendor limits, terms, what works locally) as unverified until a primary source or a run confirms them.
- **Evidence export.** Run `pnpm evidence:export` after any phase that creates or changes issues, and before each push. Read new prompts for personal data.
- **Staging.** Stage specific paths, never `git add -A`.
- **Downloads.** The shell cannot read `~/Downloads` on this machine; the Terminal panel tool can.
- **Language.** The user writes in English; prompts are part of the submission.
