---
name: contracts
description: Contracts phase. Lands everything an increment's parallel implementers share (database schema with RLS, generated types, Zod schemas, route skeletons, dependencies, UI primitives, design tokens) in one serial pass, so the increment's remaining tickets can run in parallel worktrees without conflicts. Run for ticket 1 of every increment, after /to-tickets and before /implement-spec.
argument-hint: "[contracts ticket number]"
---

# Contracts

Parallel implementers share one local database, one lockfile, one `globals.css` and one set of UI primitives. Two tickets changing any of those at once produce conflicts or a broken database, not speed. This phase makes every shared decision of one increment once, in the main session, so the tickets that follow only add files inside their own feature folder.

Work on the increment's integration branch. Do this serially and do not delegate it.

## 1. Read

The increment issue, every ticket under it, the spec above it for the data model as a whole, `docs/design/`, `GLOSSARY.md` and the ADRs in `docs/adr/`. From the tickets, collect everything they will need that is shared.

## 2. Database

- Write the migrations for every table, relation and index the tickets need (`pnpm db:new <name>`), following `.claude/rules/supabase.md`: RLS enabled and one policy per operation, in the migration that creates the table.
- Schema changes are **additive**: each one is a new migration file. A migration from a shipped increment is already applied to the cloud database, so it stays as it is, and a column or table that live code reads stays in place.
- Add pgTAP tests in `supabase/tests/` for each table's policies: the owner can, another user cannot, an anonymous visitor cannot.
- Write realistic demo data in `supabase/seed.sql`, including a demo user reviewers can sign in with. Keep the seed idempotent: the cloud database is never reset, so every increment loads it on top of the last.
- Run `pnpm db:reset`, `pnpm db:test`, then `pnpm db:types`.

## 3. Shared code

- `schema.ts` in each feature folder: the Zod schemas for its forms and actions, with the inferred types exported.
- A shared action result type in `src/lib/` if two features return form errors the same way.
- Authentication, if the increment needs it: the sign-in route, and `requireUser()` in `src/lib/auth/session.ts` redirecting to it.

## 4. Routes

Create a `page.tsx` for **every** route the increment's tickets build or link to, each a minimal placeholder with its `metadata` title. `typedRoutes` rejects a link to a route that does not exist yet, so parallel tickets can only link to each other's pages if all of them exist first. Routes of later increments wait for their own increment, so production never shows an empty page. Add the app shell: root layout, navigation, and the top-level `error.tsx` and `not-found.tsx` if they need restyling.

## 5. Dependencies and UI primitives

- Add every npm dependency the tickets need, in one go.
- Add every shadcn component the designs use (`pnpm dlx shadcn@latest add ...`; check the shadcn MCP for names).
- Apply the tokens from `docs/design/tokens.md` to `src/app/globals.css` and the fonts to the root layout. After the first increment this is only what the increment's design added.

## 6. File ownership

For every remaining ticket of the increment, write the list of files and folders it owns into the ticket body. Check that no path appears in two tickets. If two tickets need the same file, either move the shared part into this phase or make one ticket block the other.

## 7. Verify and commit

`pnpm verify`, `pnpm build`, and `pnpm e2e` for the smoke spec. Commit in small Conventional Commits (`feat(db): ...`, `feat(app): route skeletons`, `chore(ui): add primitives`), close the contracts ticket, and add a line to `docs/ai-workflow.md`.

## Done when

An implementer can finish any remaining ticket of the increment by adding and editing files only inside its own feature folder and route folder: no migration, no dependency, no new primitive, no token.
