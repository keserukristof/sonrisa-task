# Sonrisa Task

A Next.js 16 and Supabase application.

> **Status:** starter only. The feature work begins when the task arrives; this file is rewritten for reviewers during the ship phase.

- **Live:** _added after the first deployment_
- **How it was built with AI:** [docs/ai-workflow.md](docs/ai-workflow.md)

## Run it locally

Prerequisites: Node.js 22 or newer, pnpm 11, and Docker running (for the local Supabase stack).

```bash
pnpm install
pnpm bootstrap   # starts local Supabase, applies migrations and seed data, writes .env.local
pnpm dev         # http://localhost:3000
```

`pnpm bootstrap` downloads the Supabase images on its first run, which takes a few minutes. If Docker has little memory to spare, `pnpm bootstrap --lite` starts only the services the application uses (about 300 MB) and leaves out Supabase Studio.

## Scripts

| Command            | What it does                                             |
| ------------------ | -------------------------------------------------------- |
| `pnpm dev`         | Development server                                       |
| `pnpm verify`      | Format check, lint, typecheck and unit tests             |
| `pnpm verify:full` | `verify`, then production build and end-to-end tests     |
| `pnpm test`        | Unit and component tests (Vitest)                        |
| `pnpm e2e`         | End-to-end and accessibility tests (Playwright with axe) |
| `pnpm db:reset`    | Rebuild the local database from migrations and seed data |
| `pnpm db:types`    | Regenerate TypeScript types from the database schema     |
| `pnpm db:test`     | Row Level Security tests (pgTAP)                         |

## Architecture

```
src/app/                 Routes: thin pages, layouts, route handlers
src/features/<feature>/  One vertical slice per folder: queries, actions, schema, components, tests
src/components/ui/       shadcn/ui primitives
src/lib/                 Supabase clients, authentication, environment
supabase/migrations/     Database schema, the source of truth
e2e/                     Playwright specs
```

- Server Components read data and Server Actions change it; there is no separate API layer.
- Row Level Security in Postgres is the authorization boundary.
- Dependencies point one way: `app → features → lib`.

The reasoning is in [docs/adr/0001-architecture-baseline.md](docs/adr/0001-architecture-baseline.md).

## Stack

Next.js 16.4 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase (Postgres, Auth), Zod, Vitest, Playwright.
