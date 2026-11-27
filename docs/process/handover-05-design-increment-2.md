# Handover: design of increment 2, alongside the ship of increment 1

Written 2026-11-27 18:50, for the session that runs Design for increment 2 while increment 1 ships in another session. Read this, then `CLAUDE.md`, then [#4](https://github.com/keserukristof/sonrisa-task/issues/4) (the increment and its acceptance criteria), then `.claude/skills/design/SKILL.md`. For the ship itself, [handover-04](handover-04-ship-increment-1.md) is the brief; this one does not repeat it.

## Where things stand

- **Branch:** `increment-1`, pushed, clean, at the commit that adds this file. It carries increment 1's code and, since 18:10, docs-only planning commits for increment 2. No pull request yet.
- **Increment 1:** built, reviewed and fixed; full suite green at about 18:00. Not shipped. The ship runs in its own session from handover-04. The `/ship` command hit Claude Code's built-in `ship-local` instead of the project skill (handover-04, first section).
- **Increment 2 ([#4](https://github.com/keserukristof/sonrisa-task/issues/4)):** increments 2 and 3 merged into it at the 17:30 checkpoint. #5 is closed into it. 22 stories: Slack (9–16, 34), the Guardian (41), CoinGecko (42, 43, 47), admin (48, 49, 51–54, 67), and 68 and 69. Dropped into #2's Out of Scope: 17, 50, 55–57.
- **Refine is done.** The acceptance criteria are in #4, from 14 decisions (decision log, 18:40).
- **Fallback, agreed in advance (decision log, 18:20):** if Build has not started by **01:00**, cut CoinGecko (42, 43, 47), then the admin events list (51), then source health (53), and nothing further. Scope freezes at 05:30 on 2026-11-28; the deadline is 09:30.

## The plan for increment 2

| #   | Step      | When                                                                     | How                                                                    | Model      |
| --- | --------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------- |
| 1   | Design    | **Now**, alongside the ship                                              | The user types `/design`; screens approved, exported to `docs/design/` | Fable 5.2  |
| 2   | Slice     | After increment 1 is merged into `main` and `increment-2` is cut from it | The user types `/mattpocock-skills:to-tickets #4`                      | Opus 5.5   |
| 3   | Contracts | After Slice                                                              | `/contracts`; schema change for the news-keyword rule and Slack limits | Fable 5.2  |
| 4   | Build     | After Contracts, **before 01:00** or the fallback applies                | The user types `/mattpocock-skills:implement-spec #4`                  | Sonnet 5.5 |
| 5   | Review    | After Build                                                              | code review, `security-auditor`, `ux-reviewer`                         | Opus 5.5   |
| 6   | Ship      | After Review                                                             | The project's ship skill (see handover-04 on the name clash)           | Fable 5.2  |

Rules that held for increment 1 and hold again: implementers on Sonnet 5.5 at medium effort (`effort: "medium"` on every Agent call), the same testing arrangement (decision log, 16:51), one implementer per ticket in its own worktree, every report checked against its diff before a merge commit.

## For Design

- **What it designs:** the screens named in #4's criteria, on the existing design system (`docs/design/`, components.md, the artboards from increment 1):
  - `/destinations` with Slack rows (hint, Broken state with reason, Send test results, Remove), the add Slack form, and the remove confirmation with its refusal;
  - the alerts list with a destination marked broken, and the alert form with Slack checkboxes and the news-keyword rule;
  - the admin area: tabs, the overview (source health with OK, Late, Failing; today's email budget), and the Users, Events and Notifications lists with the status filter;
  - the credit lines on history rows and the admin events list.
- **Copy is fixed by #4** where it gives a sentence; Design does not change it without the user.
- **Increment 1's UX review lessons** belong in the new screens: one header on not-found, focus kept on pending buttons, the 2px focus ring, solid destructive and outline danger buttons ([1-ux-reviewer.md](../reviews/1-ux-reviewer.md)).
- **Design writes only to `docs/design/` and the Claude Design artifacts.** It does not need `increment-2`, so it can run on `increment-1` now. If the ship session works in this same folder, commit Design's files as they are approved and pull before the ship opens its pull request.

## For Contracts, later (so it is not forgotten)

- **Migrations:** the news-keyword rule as a check (with a data migration that pauses keyword-less news alerts first), the Slack per-destination test limit in `claim_test_send`, the removal refusal (a function or a check), and the 10-Slack-destinations cap. The webhook URL rule and the host check outside production are application rules, in the channel's Zod schema.
- **The local Slack stub** for e2e: a small server in `e2e/support/`, accepting the stub URL outside production only, answering any of Slack's codes on request.
- **The admin overview's queries** read `source_polls`, `email_usage` and `test_sends`; check the policies let an admin read what the overview shows.
- **`notification-row.ts`** widens its failure pattern to "The email …" or "The Slack …" (#4, "Failure reasons name their channel").
- **Applying migrations locally:** `pnpm exec supabase migration up`, never a reset by an agent (handover-04, "Things the next session will trip over").

## Only the user can

- Type `/design`, `/mattpocock-skills:to-tickets #4`, `/mattpocock-skills:implement-spec #4`, and the ship skill; switch models.
- Create, before increment 2 ships: a Guardian developer key, a CoinGecko Demo key, and a Slack workspace with one incoming webhook for the production evidence.
- Approve merges, cloud database pushes and deploys.

## Practical notes

Unchanged from handover-03 and 04: log every decision as it happens, in the user's own words only; questions list lettered options with the recommended one marked, and a visual where it helps; agent claims are beliefs until checked; `pnpm evidence:export` before each push, then read the new prompts for personal data; stage specific paths; the shell is zsh; when a guard fires, do not work around it.
