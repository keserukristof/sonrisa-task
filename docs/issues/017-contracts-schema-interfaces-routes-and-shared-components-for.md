# #17: Contracts: schema, interfaces, routes and shared components for increment 2

- **State:** closed, closed 2026-11-27 18:30 UTC
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/17

## Body

## Parent

#4

## What to build

Everything the other tickets of increment 2 share, landed once and serially, so the remaining tickets only add files in their own folders. Run with `/contracts`. Applies `docs/design/` (README, "For the increment 2 Contracts ticket") and #4's acceptance criteria.

## Acceptance criteria

- [ ] Migration: a news alert must have at least one keyword, enforced by a check; a data migration first pauses existing news alerts with no keyword
- [ ] Migration: Slack test sends limited to 5 per destination per UTC day in `claim_test_send`, using no email budget
- [ ] Migration: removing a destination that is the only destination of some alert is refused with the count of those alerts; pending notifications of a removed destination fail with "The Slack destination was removed."
- [ ] Migration: at most 10 Slack destinations per account; names unique per account, case-insensitive after trimming
- [ ] Policies let an admin read what the overview and the admin lists show (source polls, email usage, test sends, users, events, notifications); pgTAP covers them and `pnpm db:test` is green
- [ ] The Slack settings schema (URL on `https://hooks.slack.com/services/`, plus `http://127.0.0.1:<port>/slack/` outside production) and the add-destination form schema, with unit tests; the URL is never readable by the client after saving and the hint is stored
- [ ] The `retry` outcome can carry a delay that delivery honours (Slack's `Retry-After`)
- [ ] A local Slack stub for e2e under `e2e/support/`, accepting the stub URL outside production and answering any of Slack's codes on request
- [ ] One function maps a source to its credit (U.S. Geological Survey, Source: The Guardian, Powered by CoinGecko, none for simulated), usable by email and Slack rendering and by React
- [ ] Shared components: BrokenMark, AdminTabs, Filter, Meter; the admin layout with the `h1` and tabs; `/admin` becomes the overview instead of redirecting; placeholders for `/destinations/slack/new`, `/admin/users`, `/admin/events`, `/admin/notifications`
- [ ] The redirect notices "Slack destination added. Send a test to check it works." and "Slack destination removed."
- [ ] Seed: Slack destinations (one broken), Guardian and CoinGecko events, source polls in each status; idempotent
- [ ] The README says reviewers get an admin login privately, with the SQL that grants admin (story 67)
- [ ] Every other ticket of #4 lists the paths it owns, with no path in two tickets
- [ ] `pnpm verify`, `pnpm build` and the smoke e2e green

## Comments

### keserukristof, 2026-11-27 18:30 UTC

Contracts landed on `increment-2` (d90c55c to f531b07): four migrations with pgTAP (109 passing), shared schemas, the source catalog, Slack settings and reasons, BrokenMark, FilterLinks, Meter, AdminFrame, route placeholders, a local Slack stub for e2e, and owned paths on #18 to #27. `pnpm verify`, `pnpm build` and `pnpm e2e` (56) green.

### keserukristof, 2026-11-27 19:34 UTC

Security audit done after closing: F1 to F4 fixed in ddefbdb and the ticket bodies of #18, #19 and #27; see docs/reviews/2-security-auditor-contracts.md. pnpm db:test 120 passing, pnpm verify green.

