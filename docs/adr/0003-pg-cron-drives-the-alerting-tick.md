# ADR-0003: The database's scheduler drives the alerting tick

- **Status:** accepted
- **Date:** 2026-11-27

## Context

Sources must be polled and notifications sent about once a minute (ADR-0002 puts that work in a Next.js route). Something has to call that route on a schedule. The application is hosted on Vercel's Hobby plan and the database on Supabase.

## Decision

Supabase's `pg_cron` runs a job every minute that calls the route over HTTP with `pg_net`. The route authenticates the call with a secret of its own, which grants nothing except starting a tick.

## Considered options

- **Vercel's own scheduling.** Rejected: on Hobby, Cron Jobs run once a day, and Schedules run every 15 minutes at best with a capped number of runs. See [research-01](../process/research-01-slack-oauth-vercel-cron.md).
- **An external cron service calling the route.** Rejected: one more account and one more dependency for something the database already offers.

## Evidence

Checked on 2026-11-27 in the local database (the lite stack) before deciding: a `pg_cron` job scheduled every 5 seconds called `net.http_get` against a throwaway server on the host, which answered 200 twice, and `cron.job_run_details` recorded both runs as succeeded. Not yet checked: the same job in the hosted Supabase project calling the deployed route.

## Consequences

- **The route's secret must be narrow, and never the Supabase secret key.** `pg_net` keeps each request, headers included, in `net.http_request_queue`, and in the local database `anon` and `authenticated` have usage on the `net` schema and `select` on that table. The schema is not exposed through the API today. A leaked tick secret can only start a tick; a leaked database key would open everything. The migration that enables `pg_net` must also check who can read the `net` schema.
- **A tick must be safe to run twice and to overlap with the next one.** The scheduler does not wait for the previous call to finish.
- **The job needs the deployed URL and the secret inside the database**, so each environment sets them when the job is created. Local development points the job at the developer's machine.
- Notifications arrive up to a minute after an event is ingested, plus the source's own polling interval.
- The schedule is defined in a migration, so it is versioned with the schema and visible in review.

## Addendum, 2026-11-27: what the Contracts ticket found

Two things turned out differently when the scheduler was built (ticket #15).

- **The `net` schema cannot be restricted from a migration.** `pg_net`'s install grants `PUBLIC` usage on the schema and every privilege on `net.http_request_queue`. Those grants are made by `supabase_admin`. Migrations run as `postgres`, which is not a member of that role and not a superuser, so `REVOKE` does nothing ("no privileges could be revoked", checked in the local database). The spec asked the migration to restrict the schema; it cannot. What protects the header instead:
  - The API does not expose the `net` schema: PostgREST answers 406 for it, and `e2e/smoke.spec.ts` checks that on every run.
  - The header carries only the tick secret, as decided above.
  - No function in an exposed schema reads from `net`.
- **The URL and the secret live in Supabase Vault, not in database settings.** The job calls `private.trigger_tick()`, which reads `tick_url` and `tick_secret` from `vault.decrypted_secrets` and does nothing until both exist. Vault is Supabase's documented place for the values a `pg_cron` job sends with `pg_net`, and it is present in the local stack. Each environment sets its own two secrets: `scripts/local-env.mjs` does it locally, and the user does it in the hosted project during `/ship`.

Still not checked: the job in the hosted project calling the deployed route.
