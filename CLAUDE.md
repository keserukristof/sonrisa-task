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

The brief is understood once, then built in **increments**: thin slices of the spec that each go through the whole loop and reach production before the next one starts.

**Once, for the whole brief:**

| #   | Phase      | How                                                              | Model    |
| --- | ---------- | ---------------------------------------------------------------- | -------- |
| 1   | Understand | `/grill-with-docs` on the task brief, then `/to-spec`            | Opus 5.5 |
| 2   | Increments | Cut the spec into ordered increment issues, approved by the user | Opus 5.5 |

**Then for each increment, in order:**

| #   | Phase     | How                                                                             | Model      |
| --- | --------- | ------------------------------------------------------------------------------- | ---------- |
| 3   | Refine    | Grill the increment, write the outcome into its issue                           | Opus 5.5   |
| 4   | Design    | `/design`: the increment's screens (first run: the design system too), approved | Fable 5.2  |
| 5   | Slice     | `/to-tickets #<increment>`: vertical slices with blocking edges                 | Opus 5.5   |
| 6   | Contracts | `/contracts`: schema, types, routes, tokens. Serial                             | Fable 5.2  |
| 7   | Build     | `/implement-spec #<increment>`: one `implementer` per ticket, in parallel       | Sonnet 5.5 |
| 8   | Review    | `/code-review`, then `security-auditor` and `ux-reviewer`                       | Opus 5.5   |
| 9   | Ship      | `/ship`: deploy, verify production, update README and write-up                  | Fable 5.2  |

Phases 1, 2, 3 and 5 run in the main session, so the user switches the session model for them. Phases 7 and 8 get their model from the agent definitions in `.claude/agents/`.

- **Everything agreed in the grill is Must.** The spec has no priority tiers: what was not agreed goes under its Out of Scope. Increments order the Must scope, most valuable flow first.
- Scope freezes four hours before the deadline: no increment starts after that.
- **The increment issue stands in for the spec** wherever a plugin skill takes one: `/to-tickets`, `/implement-spec` and the Spec axis of `/code-review`. Given the whole spec, they would review and close work that later increments own. The increment bounds the scope; the implementation and testing decisions still come from the spec above it. Issue structure is in `docs/agents/issue-tracker.md`.
- **Refine** is a ten-minute grill of one increment with `mattpocock-skills:grilling`: edge cases, empty and error states, acceptance criteria. It is done when every user story of the increment has acceptance criteria written into the increment issue. Implementers read issues, not this conversation.
- **Ticket 1 of every increment is "Contracts"** and blocks that increment's other tickets. See `/contracts` for why.
- `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement-spec` and `/ship` run only when the user types them. When the loop reaches one, name the exact command and wait.
- A small change (one feature folder, no schema change) needs no increment: implement it directly with `/tdd`. The gates still apply.
- `/design`, `/contracts` and `/ship` are project skills in `.claude/skills/`. Every other command in the tables comes from the `mattpocock-skills` plugin and is namespaced: `/mattpocock-skills:to-spec`, and `mattpocock-skills:tdd` when calling the Skill tool. Use the plugin's `code-review`, not the built-in one of the same name.
- After each phase, add one line to `docs/ai-workflow.md` saying what was used and what it produced.

## Process evidence

The reviewers judge how the result was reached, not the result. The brief is in `docs/process/brief.md`. Record the process while it happens, in the repository, never from memory at the end:

- **Decision log** (`docs/process/decision-log.md`): append a row whenever the user chooses, overrules, rejects or redirects, and whenever agent output is rejected or corrected after a check. Say who decided and link the evidence: a test run, a doc, a review file, a screenshot. A rejection with its reason is worth more than an acceptance.
- **Reviews** (`docs/reviews/`): save every report from `/code-review`, `security-auditor` and `ux-reviewer` verbatim, with a disposition for each finding, in the format of `docs/reviews/README.md`. The review agents are read-only, so the main session writes the file. An implementer report that was not accepted as it stood gets a file too.
- **Screenshots** (`docs/screenshots/`): what was checked by looking, named as that folder's README says.
- **Prompts and issues**: run `pnpm evidence:export` after any phase that creates or changes issues, and before each push. It regenerates `docs/prompts/` and `docs/issues/`; never edit those by hand.
- Before a push that includes `docs/prompts/`, read the new prompts for personal data the redaction missed.

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

Implementers run in separate git worktrees against **one shared local database**. Parallel work stays safe only because the increment's Contracts ticket lands everything shared first. Inside an implementation ticket, never:

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
