@AGENTS.md

# Sonrisa Task

A Next.js 16 and Supabase application built inside a 24-hour window with AI agents. Reviewers judge the result and the process, so both must stay legible: small commits, a spec, tickets, and decisions written down.

## Commands

| Command            | What it does                                                            |
| ------------------ | ----------------------------------------------------------------------- |
| `pnpm bootstrap`   | Start local Supabase, apply migrations and seed, write `.env.local`     |
| `pnpm dev`         | Dev server (Turbopack) on port 3000                                     |
| `pnpm verify`      | Format check, lint, typecheck, unit tests. The gate for every change    |
| `pnpm verify:full` | `verify` plus production build and Playwright e2e. The gate before ship |
| `pnpm db:new <n>`  | Create a migration                                                      |
| `pnpm db:reset`    | Rebuild the local database from migrations and `supabase/seed.sql`      |
| `pnpm db:types`    | Regenerate `src/lib/supabase/database.types.ts`                         |
| `pnpm db:test`     | pgTAP tests for Row Level Security                                      |

## Architecture

```
src/app/                 Routes only: thin pages, layouts, route handlers
src/features/<feature>/  One vertical slice per folder
  queries.ts             Reads (server-only, return DTOs)
  actions.ts             Mutations (Server Actions)
  schema.ts              Zod schemas shared by forms and actions
  *.tsx, *.test.ts       Components and their tests, colocated
src/components/ui/       shadcn/ui primitives (generated, do not hand-edit)
src/lib/                 Cross-cutting: Supabase clients, auth, env
supabase/migrations/     The schema's source of truth
```

Dependencies point one way: `app → features → lib`. A feature never imports another feature; shared code moves down to `src/lib` or `src/components`.

## Non-negotiables

1. **Read the bundled Next.js docs before using an API** (`node_modules/next/dist/docs/`). Version 16 differs from what you remember.
2. **Row Level Security is the authorization boundary.** Every table enables RLS in the migration that creates it.
3. **Request-time data renders inside `<Suspense>`.** Cache Components is on; `pnpm build` fails otherwise.
4. **Every Server Action re-checks the user and validates input with Zod.** Treat each one as a public endpoint.
5. **No `any`, no `as` casts on external data, no non-null assertions.** Parse, do not assume.
6. **Every data view handles loading, empty, error and success.**
7. **Never weaken, skip or delete a test to get green.**

Detailed rules live in `.claude/rules/` and load automatically for the files they cover.

## Workflow

| #   | Phase      | How                                                            | Model      |
| --- | ---------- | -------------------------------------------------------------- | ---------- |
| 1   | Understand | `/grill-with-docs` on the task brief, then `/to-spec`          | Opus 5.5   |
| 2   | Design     | `/design`: design system and screens, approved by the user     | Fable 5.2  |
| 3   | Slice      | `/to-tickets`: vertical slices with blocking edges             | Opus 5.5   |
| 4   | Contracts  | `/contracts`: schema, types, routes, tokens. Serial            | Fable 5.2  |
| 5   | Build      | `/implement-spec`: one `implementer` per ticket, in parallel   | Sonnet 5.5 |
| 6   | Review     | `/code-review`, then `security-auditor` and `ux-reviewer`      | Opus 5.5   |
| 7   | Ship       | `/ship`: deploy, verify production, finish README and write-up | Fable 5.2  |

Phases 1 and 3 run in the main session, so the user switches the session model for them. Phases 5 and 6 get their model from the agent definitions in `.claude/agents/`.

- The spec splits scope into **Must / Should / Could**. Build Must first; scope freezes four hours before the deadline.
- **Ticket 1 is always "Contracts" and blocks every other ticket.** See `/contracts` for why.
- A small change (one feature folder, no schema change) skips phases 1 to 4: implement it directly with `/tdd`. The gates still apply.
- `/design`, `/contracts` and `/ship` are project skills in `.claude/skills/`. Every other command in the table comes from the `mattpocock-skills` plugin and is namespaced: `/mattpocock-skills:to-spec`, and `mattpocock-skills:tdd` when calling the Skill tool. Use the plugin's `code-review`, not the built-in one of the same name.
- After each phase, add one line to `docs/ai-workflow.md` saying what was used and what it produced.

## Agent routing

When a skill asks for a sub-agent, use the project agent instead of a generic one:

| The skill asks for                   | Use                |
| ------------------------------------ | ------------------ |
| An implementer sub-agent             | `implementer`      |
| A Standards or Spec review sub-agent | `reviewer`         |
| A security or RLS review             | `security-auditor` |
| A UI, UX or accessibility review     | `ux-reviewer`      |

One agent advises instead of building or reviewing: `nextjs-advisor` answers a Next.js 16 question from the bundled docs, read-only. The main session consults it before routing, rendering or caching decisions in the Contracts ticket, and when an implementer reports a framework error it could not resolve.

## Parallel work

Implementers run in separate git worktrees against **one shared local database**. Parallel work stays safe only because the Contracts ticket lands everything shared first. Inside an implementation ticket, never:

- add or edit a migration, or run `pnpm db:reset`
- add, remove or upgrade a dependency
- add shadcn components or edit `src/components/ui/` or `src/app/globals.css`
- edit files owned by another ticket

If a ticket needs one of these, stop and report the missing contract. The main session fixes it once, serially.

## Definition of done

- `pnpm verify` is green, and `pnpm build` is green when routes or data access changed.
- New behaviour has a test at the seam the spec named.
- The acceptance criteria of the ticket are met and demonstrable in the browser.
- Committed with a Conventional Commit message that references the ticket: `feat(projects): create project form (#12)`.

## Agent skills

### Issue tracker

Specs and tickets live as GitHub issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels, unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` at the root and ADRs in `docs/adr/`. See `docs/agents/domain.md`.
