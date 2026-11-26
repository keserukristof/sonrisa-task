# ADR-0001: Architecture baseline

- **Status:** accepted
- **Date:** 2026-11-26

## Context

The application is built in 24 hours by one developer directing AI agents, several of them in parallel. The architecture has to be conventional enough that agents get it right from documentation, and partitioned so that parallel work does not collide.

## Decisions

### Next.js 16 App Router with Cache Components for frontend and backend

One deployable, one language, one type system from database to UI. Server Components read data directly and Server Actions mutate it, so there is no hand-written API layer to keep in sync. Cache Components is the framework default in 16.4 and makes the split between static shell and request-time content explicit and build-checked.

### Supabase for database, authentication and authorization

Postgres with Row Level Security puts authorization next to the data, where it holds no matter which code path reaches it. Types are generated from the schema, so a schema change that breaks a query fails typecheck.

### Per-user reads are uncached; shared reads may be cached

The session lives in cookies, and a cookie-bound client cannot run inside a `"use cache"` scope. Per-user data is read fresh behind `<Suspense>`. Data identical for every visitor goes through a cookie-less client and may be cached with an explicit lifetime and tag. This trades some speed for never serving one user's data to another.

### Vertical feature folders with one-way dependencies

`app → features → lib`, and features do not import each other. A ticket maps to one feature folder, which is what lets implementers work in parallel worktrees without touching the same files.

### Contracts before parallel work

Schema, generated types, route skeletons, dependencies, UI primitives and design tokens are shared by every ticket. They land first, serially, in one "Contracts" ticket. Parallel tickets then only add files inside their own folders.

### Quality gates are deterministic

`pnpm verify` (format, lint, typecheck, unit tests) runs from a hook before any agent can finish a turn that changed code, and in CI on every push. An agent's claim of "done" is backed by the same command a human would run.

## Consequences

- Client-side interactivity that needs live data goes through Server Actions and re-rendering, not a client data-fetching library. If the task demands heavy client state, revisit this.
- The local database is shared by all worktrees, so schema changes are serial by rule, not by tooling.
- Nonce-based Content Security Policy is incompatible with the prerendered shell; the header-only policy in `next.config.ts` allows inline scripts.
