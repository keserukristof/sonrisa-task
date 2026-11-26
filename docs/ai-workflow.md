# How this project was built with AI

One page on the solutions actually used. It is filled in as the work happens; rows that did not happen are removed before submission.

## Starting point

- **Prepared before the task arrived (2026-11-26):** this starter (Next.js 16, Supabase, quality gates, CI, deploy pipeline) and the agent setup described below. No task-specific code.
- **Built during the 24 hours:** everything under `src/features/`, the database schema, the design and the tests for them.

## Tools

| Tool                                          | Used for                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Claude Code (desktop app)                     | Main session: planning, architecture, orchestration                                        |
| Fable 5.2 / Opus 5.5 / Sonnet 5.5             | Architecture and orchestration / spec and review / parallel implementers                   |
| `mattpocock-skills` plugin (third party, MIT) | Process spine: grilling, spec, tickets, parallel implementation, TDD, two-axis code review |
| Project skills (`.claude/skills/`)            | `design`, `contracts`, `ship`: the phases the plugin does not cover                        |
| Project agents (`.claude/agents/`)            | `implementer`, `reviewer`, `security-auditor`, `ux-reviewer`                               |
| Project rules (`.claude/rules/`)              | Next.js 16, Supabase, UI and testing conventions, loaded per file path                     |
| Hooks (`.claude/hooks/`)                      | Format and lint on every edit; lint, typecheck and tests before an agent may finish        |
| MCP servers                                   | next-devtools, context7, shadcn, Playwright, Supabase                                      |
| Claude Design artifacts                       | Design system and screens, approved before implementation                                  |

## Phases

| #   | Phase      | What was used                                                     | Output           |
| --- | ---------- | ----------------------------------------------------------------- | ---------------- |
| 1   | Understand | `/grill-with-docs`, `/to-spec`                                    | _spec issue_     |
| 2   | Design     | `/design`, Claude Design System and Design                        | _docs/design/_   |
| 3   | Slice      | `/to-tickets`                                                     | _ticket issues_  |
| 4   | Contracts  | `/contracts`                                                      | _commits_        |
| 5   | Build      | `/implement-spec`, parallel `implementer` agents in git worktrees | _pull request_   |
| 6   | Review     | `/code-review`, `security-auditor`, `ux-reviewer`                 | _findings fixed_ |
| 7   | Ship       | `/ship`                                                           | _live URL_       |

## Ideas that shaped the setup

- **Contracts before parallel work.** Schema, types, routes, dependencies and design tokens land first and serially; parallel agents then only add files in their own feature folder.
- **Gates are commands, not promises.** A hook runs lint, typecheck and tests before any agent can finish a turn that changed code. CI runs the same script.
- **Fresh eyes review.** Reviewers are separate agents that see only the diff, the spec and the written standards.
- **Docs over memory.** Next.js 16 ships its documentation in the package; the rules send agents there before they write framework code.
- **Design before code.** The look and the screens are approved first and exported into the repo, so every implementer builds the same thing.

## What I decided myself

_Filled in during the task: scope cuts, trade-offs, places where I overruled the agents._

## What did not work

_Filled in during the task._
