# Heads-up

Heads-up tells you when something in the world reaches the importance you chose: an earthquake, a major news story, a sharp crypto move. You set up alerts, and they reach your email or a Slack channel; an admin sees the whole system and can simulate an event to prove the path end to end.

- **Live:** https://sonrisa-task.vercel.app ([health check](https://sonrisa-task.vercel.app/api/health)). Reviewers get a user login and an admin login privately (see [Admin access](#admin-access)).
- **Reviewers, start here:** [docs/review-guide.md](docs/review-guide.md): what was done, the key decisions, and what the AI got wrong and how it was caught, task by task.
- **How it was built with AI:** [docs/ai-workflow.md](docs/ai-workflow.md).

Built in 24 hours from a four-sentence brief ([docs/process/brief.md](docs/process/brief.md)), with AI agents, in two increments.

## Run it locally

Prerequisites: Node.js 22 or newer, pnpm 11, and Docker running (for the local Supabase stack).

```bash
pnpm install
pnpm bootstrap   # starts local Supabase, applies migrations, loads demo data, writes .env.local
pnpm dev         # http://localhost:3000
```

- **Demo accounts (local only):** `demo@heads-up.test` / `demo-password` and the admin `admin@heads-up.test` / `admin-password`.
- **Email:** locally every email lands in the mail catcher at http://127.0.0.1:54324.
- **Events:** real feeds are polled only in production. Locally, sign in as the admin and use **Admin → Simulate** to create an event; within a minute the tick matches and delivers it.

`pnpm bootstrap` downloads the Supabase images on its first run, which takes a few minutes. If Docker has little memory to spare, `pnpm bootstrap --lite` starts only the services the application uses.

## What was built

| The brief asked for                                    | What exists                                                                                                                                                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alerts when "something important happens in the world" | An alert names a category, a minimum severity on one four-level scale, optional keywords (required for news), and its destinations. Users create, edit, pause and delete them.                     |
| "Breaking news, market movements, natural disasters"   | Three real feeds: USGS earthquakes (every minute), the Guardian's world, business and environment sections (every 3 minutes), CoinGecko's top 20 coins moving ±3% in an hour (every 5 minutes).    |
| "Should work for both email and Slack"                 | The account email, and any number of Slack channels by incoming webhook. "Send test" per destination; a Slack channel Slack reports as gone is marked broken. Limits and retries protect delivery. |
| "Flexible enough that we can add more channels later"  | `Channel` and `Source` interfaces in `src/lib/alerting/types.ts`. Slack and two sources were added in increment 2 without changing the alerting core.                                              |
| "We need an admin view too"                            | `/admin`: source health and today's email budget; lists of users, events and notifications (filterable by status); and simulation of an event through the real path.                               |

Users also see their notification history with each notification's status and reason, and every event credits its source.

**Deliberately left out** (the full list and the reasons are in the spec's Out of Scope, [#2](https://github.com/keserukristof/sonrisa-task/issues/2)): Slack OAuth ("Add to Slack"), password reset, teams, other channels, equities, natural disasters other than earthquakes, promoting admins from the interface, a public API.

**Increments:** both have shipped. Increment 3 (the admin view) was merged into increment 2 at the planned checkpoint ([plan of attack](docs/process/plan-of-attack.md)).

## Admin access

Reviewers get an admin login for the live site privately, not in this repository. Locally, `pnpm bootstrap` creates the demo admin above.

There is no way to promote a user from the interface. To make an existing account an admin, run this in the Supabase SQL editor of the project, replacing the email:

```sql
update public.profiles
set role = 'admin'
where email = 'reviewer@example.com';
```

## Architecture

One Next.js application on Vercel and one Supabase project. Every minute `pg_cron` calls the application's tick route (through `pg_net`, with a secret from Supabase Vault); the tick polls the sources that are due, stores new events, matches them against alerts in the database, applies the email limits, and delivers through the channels with retries. Pages are Server Components, mutations are Server Actions, and Row Level Security in Postgres is the authorization boundary.

```
src/app/                    Routes: thin pages, layouts, the tick route
src/features/<feature>/     One vertical slice per folder: queries, actions, schema, components, tests
src/lib/alerting/           The alerting core, framework-free: types, the tick, sources/, channels/
src/components/             Shared components and shadcn/ui primitives
supabase/migrations/        The schema; every table enables Row Level Security where it is created
supabase/tests/             pgTAP tests of the policies and database functions
e2e/                        Playwright specs, one per feature, each with an accessibility scan
```

The reasoning: [ADR-0001](docs/adr/0001-architecture-baseline.md) (baseline), [ADR-0002](docs/adr/0002-background-work-in-the-same-deployable.md) (background work in the same deployable), [ADR-0003](docs/adr/0003-pg-cron-drives-the-alerting-tick.md) (`pg_cron` drives the tick).

## Tests

| Command            | What it runs                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `pnpm verify`      | Format check, lint, typecheck and unit tests (Vitest). CI runs it on every pull request.             |
| `pnpm db:test`     | pgTAP: Row Level Security and the database functions                                                 |
| `pnpm test:db`     | The alerting tick against the real local database, with fake sources and channels                    |
| `pnpm e2e`         | A production build, then Playwright on desktop and mobile with axe scans, against a local Slack stub |
| `pnpm verify:full` | `verify`, then the production build and the end-to-end tests                                         |

## Known limitations and what would come next

- **Production email uses Resend's test sender**, so it reaches only the project owner's address. Reviewers sign in with accounts created for them (handed over privately); alerts to Slack work for anyone. A verified sending domain lifts this.
- The Guardian and CoinGecko mappers are unit-tested on responses built from the providers' documentation; they should be re-recorded from the live APIs.
- Admins are granted by SQL; promotion from the interface was cut.
- A removed Slack destination shows as "Removed destination" in history, because its name is not kept.
- The landing page still describes increment 1 (earthquakes, by email); the app itself has Slack, news and markets.
- Notices after a redirect live in the URL and reappear on refresh.
- Next: Slack OAuth instead of pasted webhooks, a digest instead of one notification per event, and more sources per category.

## Scripts

| Command          | What it does                                             |
| ---------------- | -------------------------------------------------------- |
| `pnpm dev`       | Development server                                       |
| `pnpm bootstrap` | Local Supabase, migrations, demo data, `.env.local`      |
| `pnpm db:reset`  | Rebuild the local database from migrations and demo data |
| `pnpm db:types`  | Regenerate TypeScript types from the database schema     |

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase (Postgres, Auth, `pg_cron`, `pg_net`, Vault), Resend, Zod, Vitest, Playwright.

How it was built, with every prompt, decision and review: [docs/ai-workflow.md](docs/ai-workflow.md).
