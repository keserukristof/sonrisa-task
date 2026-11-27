# Handover: ship of increment 1

Written 2026-11-27 18:05 at the end of the session that ran Build and Review for increment 1, for the session that runs Ship. Read this, then `CLAUDE.md`, then `.claude/skills/ship/SKILL.md`, then the increment issue [#3](https://github.com/keserukristof/sonrisa-task/issues/3). The previous handover, [handover-03](handover-03-build-increment-1.md), still holds for everything under "For /ship" and "Only the user can".

## Before anything else: `/ship` ran the wrong skill

- **What happened:** the user typed `/ship` at the end of the last session. It started Claude Code's built-in `ship-local` review instead of the project skill in `.claude/skills/ship/`, because both are named `ship`. The built-in one also said `/ship isn't available over Remote Control`.
- **What it did:** nothing. Its high-effort review was stopped before it reported, on the user's request for this handover. It changed no files.
- **What to do:** the project skill has `disable-model-invocation: true`, so an agent cannot start it. Ask the user to run it in a way that reaches the project skill: from a local session rather than over Remote Control, and if `/ship` still starts the built-in one, by telling the session to read `.claude/skills/ship/SKILL.md` and follow it. Log what was done in the decision log.

## Where things stand

- **Branch:** `increment-1`, pushed, clean, at `62a4e41`. No pull request yet; `/ship` opens it.
- **Live:** https://sonrisa-task.vercel.app still runs the starter.
- **Done for increment 1:** Refine, Design, Slice, Contracts, Build, Review. Each has a line in [docs/ai-workflow.md](../ai-workflow.md).
- **Open tickets:** #7 to #14, all built and merged into `increment-1`. They close through the increment's pull request, as `docs/agents/issue-tracker.md` says; do not close them by hand.
- **Worktrees:** all implementer worktrees and branches are removed.
- **Checks on `increment-1`, last run at about 18:00:**
  - `pnpm verify` green, 115 unit tests.
  - `pnpm build` green (inside the e2e run).
  - `pnpm db:test` green, 76 pgTAP checks.
  - `pnpm test:db` green, 17 tick integration tests.
  - `pnpm e2e` green, 56 tests on both projects (chromium and mobile).
- **CI has never run on this branch.** It runs on pull requests only, and includes `pnpm db:test` and `pnpm test:db`, which have never run in CI.

## What changed since handover-03

- **Built:** #7 to #14, by eight `implementer` agents (Sonnet 5.5, medium effort). The user confirmed the testing arrangement and the autonomy settings (decision log, 16:51).
- **Caught at merge:** the queries for alerts, destinations and history did not filter by user, and RLS lets admins read every row, so an admin's own pages showed everyone's data. Fixed in `c27718a`, with `e2e/admin-own-data.spec.ts`.
- **Reviewed:** code review (standards and spec), security audit and UX review, each saved verbatim with dispositions: [1-code-review.md](../reviews/1-code-review.md), [1-security-auditor.md](../reviews/1-security-auditor.md), [1-ux-reviewer.md](../reviews/1-ux-reviewer.md). Accepted findings are fixed and referenced by commit.
- **One reviewer diagnosis rejected:** the UX reviewer blamed `cn` for missing outline borders; the cause was `buttonVariants()` returning `cva`'s unmerged string. Fixed at the cause in `e3d0790`.
- **New migration:** `supabase/migrations/20261127162316_test_send_system_limit.sql` gives the 20-a-day test-send cap its own outcome, `system_test_limit`. Applied locally with `supabase migration up`, no reset. **The hosted database does not have it.** Generated types are unchanged (same return type).
- **Shared-layer changes by the main session:** `src/components/ui/button.tsx` (merged variants, solid destructive, 2px focus ring, semibold), focus rings in the other primitives, two `@utility` rules in `globals.css`. `src/components/placeholder.tsx` is deleted.

## For `/ship`, on top of handover-03's list

- **Push migration `20261127162316`** with the rest. It needs the user's approval, like every cloud database push.
- **Sign-up redirect:** in production the confirmation link is now built from `APP_URL` (`src/features/auth/origin.ts`), never from request headers. So `APP_URL` in Vercel must be the exact production origin, and the hosted redirect allow-list must contain `https://<prod>/auth/confirm` with no wildcard. Set the hosted Site URL to the production origin too: if Supabase falls back to it, the template's bare `{{ .RedirectTo }}` drops `/auth/confirm` and confirmation silently breaks. Then do one real sign-up end to end.
- **Account enumeration check (security audit N5):** in production, an unconfirmed address with a wrong password must say "Email or password is incorrect.", not the unconfirmed message. If it says the unconfirmed message, log it and decide with the user.
- **Check whether Vercel overwrites `X-Forwarded-Host`.** No longer needed for the redirect, but the audit asked.
- **Vault in the hosted project:** still unverified that the scheduled job can read Vault as `postgres` there. Check Supabase's documentation first (handover-03, "Not verified yet").
- **Known limitations for the README** (deferred findings, each with its reason in the review files):
  - Notices live in the URL (`?notice=…`) and come back on refresh.
  - A signed-in user on link-expired sees the signed-out header.
  - Recorded USGS responses are used by unit tests only; local development delivers through simulated events.
  - Two `as` casts in `saveAlert`, because the generated RPC types mark nullable arguments non-null.
  - Login CSRF on `/auth/confirm` (negligible impact, Supabase's standard flow).
  - Loading and error states were checked in markup, not seen live.
- **Evidence:** a screenshot of a simulated event's email arriving in production, in `docs/screenshots/` as its README names it.

## After `/ship`

- **The 17:30 checkpoint has passed**, so increments 2 and 3 merge into one smaller increment (plan of attack). What it drops is not decided: put it to the user as a grill with lettered options and a marked recommendation, with visuals where they help.
- Scope freezes at 05:30 on 2026-11-28. The deadline is 09:30.

## Things the next session will trip over

- **`pnpm db:reset` cannot be run by an agent** (it ends by editing `.env.local`). To apply a new migration locally, use `pnpm exec supabase migration up`, which keeps the Vault. A real reset needs `pnpm exec supabase db reset`, `node scripts/seed-local.mjs`, then the user runs `node scripts/local-env.mjs`.
- **e2e and the confirmation link:** the e2e build runs in production mode, so confirmation links point at `APP_URL`; `e2e/auth.spec.ts` follows the link's path on the server under test.
- **The shared database fills up with test sends during a day.** pgTAP and e2e tests must count only their own rows; `supabase/tests/test_send_limits.test.sql` had to be fixed for this once.
- **`next dev` and new `@utility` rules:** the UX reviewer saw the notification grid missing under a dev server that was likely started before the utility was added. Restart dev after a `globals.css` change before judging the layout.
- **Mobile menu focus trap** is a hand-written `onKeyDown` cycle in `src/components/mobile-menu.tsx`, because the `Sheet` did not trap Tab. If a later shadcn update fixes the primitive, remove it.

## Practical notes

Unchanged from handover-03: log decisions as they happen and only in the user's own words; lettered options with the recommended one marked; agent claims are beliefs until checked against a diff and a test run; `pnpm evidence:export` before each push, then read the new prompts for personal data; stage specific paths; the shell is zsh; when a guard fires, do not work around it.
