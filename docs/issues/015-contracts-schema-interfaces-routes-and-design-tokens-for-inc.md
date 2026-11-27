# #15: Contracts: schema, interfaces, routes and design tokens for increment 1

- **State:** closed, closed 2026-11-27 15:38 UTC
- **Opened:** 2026-11-27 14:21 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/ai-task/issues/15

## Body

## Parent

#3

## What to build

Everything the other tickets of increment 1 share, landed once and serially, so the remaining tickets only add files in their own feature and route folders. Run with `/contracts`. Applies the design from `docs/design/` and the data model from the spec #2.

## Acceptance criteria

- [ ] Migrations for profiles, destinations, alerts, alert_destinations, events, notifications, source_polls and a log of test sends, each with RLS enabled and its policies, as the spec's data model says
- [ ] Every new account gets a profile and exactly one email destination, created in the database
- [ ] The role change and simulate functions are security-definer and check the caller is an admin; an admin cannot change their own role
- [ ] `pg_cron` and `pg_net` enabled; the tick job reads its URL and secret from Supabase Vault and does nothing until both are set (ADR-0003 addendum). The `net` schema cannot be restricted from a migration: its grants belong to `supabase_admin`. An end-to-end test proves the API does not expose it instead
- [ ] pgTAP tests for every policy in #3's Tests section; `pnpm db:test` green
- [ ] Matching with limits and claiming for delivery are SQL functions callable only by the tick, because the API cannot lock rows; pgTAP covers them
- [ ] Seed: a demo user and a demo admin, alerts, events (one simulated) and notifications in every status; idempotent
- [ ] Email confirmation enabled locally; local auth emails reach the mail catcher
- [ ] Server-only env schema (secret key, tick secret, Resend key and sender, Guardian key, CoinGecko key, real-polling flag), and an admin client used only by the tick
- [ ] The Source and Channel interfaces and the severity and category enumerations, as types the alerting core and the adapters share
- [ ] Zod schemas for the sign-up, sign-in, alert and simulate forms, with unit tests for the rules in #3
- [ ] The sign-in route, `requireUser` (with `?next=`) and `requireAdmin` (not-found for non-admins)
- [ ] A placeholder page for every route of #3, the app header with the 360px menu, and restyled `not-found` and `error` pages
- [ ] Tokens applied to `globals.css`, Schibsted Grotesk as the font, the shadcn primitives and shared components listed in `docs/design/components.md`, and one shared way to show a notice after a redirect
- [ ] Every other ticket of #3 lists the paths it owns, with no path in two tickets
- [ ] `pnpm verify`, `pnpm build` and the smoke e2e green

## Comments

### keserukristof, 2026-11-27 15:38 UTC

Done on `increment-1` (06cc7fc..1f48511). 74 pgTAP checks, 38 unit tests and 20 end-to-end tests pass. The security audit's three high findings are fixed: docs/reviews/1-security-auditor-contracts.md. Four choices that differ from the spec were confirmed by the user and written into #2 and #3. One step is left to a person: `node scripts/local-env.mjs`, because agents may not edit .env.local.

