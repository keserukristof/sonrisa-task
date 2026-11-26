---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "e2e/**"
  - "supabase/tests/**"
  - "vitest.config.mts"
  - "playwright.config.ts"
---

# Testing rules

Tests verify behaviour through public interfaces at the seams the spec agreed. They are written test-first with the `tdd` skill.

## Which test for what

| What                                                             | Tool                     | Where                       |
| ---------------------------------------------------------------- | ------------------------ | --------------------------- |
| Pure logic: Zod schemas, mappers, domain functions               | Vitest                   | `*.test.ts` next to source  |
| Client Components with behaviour                                 | Vitest + Testing Library | `*.test.tsx` next to source |
| A user story end to end, including Server Components and actions | Playwright               | `e2e/<feature>.spec.ts`     |
| Row Level Security policies                                      | pgTAP (`pnpm db:test`)   | `supabase/tests/`           |

- Vitest cannot render `async` Server Components. Cover them through Playwright.
- Do not mock the Supabase client. Extract the logic into a pure function and unit-test that; cover the database path with Playwright and pgTAP.

## Unit and component tests

- Name tests as behaviour: "shows the field error when the title is empty".
- Expected values are literals or worked examples, never recomputed the way the code computes them.
- Query by role and accessible name (`getByRole`), the way a user finds things.

## End-to-end tests

- One spec per feature covering the Must user stories on the happy path, plus the most important failure path.
- Locate by role, label and text. No CSS selectors, no test ids unless nothing else is stable.
- Each test sets up what it needs and does not depend on another test's leftovers.
- Each user-facing page gets an axe scan (see `e2e/smoke.spec.ts`).
- In a worktree, run with its own port: `PORT=31xx pnpm e2e`.

## Integrity

- Never weaken an assertion, add `.skip` or `.only`, or delete a test to get green. If a test is wrong, say why in the commit message.
- A flaky test is a bug: fix the cause, do not add a retry.
