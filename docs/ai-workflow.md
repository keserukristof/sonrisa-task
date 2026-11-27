# How this project was built with AI

The map of the process. This page summarises; the evidence it points to is the submission. It is filled in as the work happens.

## Where the evidence is

| What                                                                    | Where                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| The brief, verbatim                                                     | [docs/process/brief.md](process/brief.md)                          |
| What was prepared before the task, and what went wrong then             | [docs/process/00-preparation.md](process/00-preparation.md)        |
| The plan of attack: deliverables, order, why                            | [docs/process/plan-of-attack.md](process/plan-of-attack.md)        |
| Every decision, rejection and course correction                         | [docs/process/decision-log.md](process/decision-log.md)            |
| Every prompt since the task arrived, and every brief sent to a subagent | [docs/prompts/](prompts/README.md)                                 |
| The spec, increments and tickets, with comments                         | [docs/issues/](issues/README.md)                                   |
| Glossary and architecture decisions from the grill                      | [GLOSSARY.md](../GLOSSARY.md), [docs/adr/](adr/)                   |
| The approved design                                                     | [docs/design/](design/README.md)                                   |
| Every review, and what was done about each finding                      | [docs/reviews/](reviews/README.md)                                 |
| Screenshots                                                             | [docs/screenshots/](screenshots/README.md)                         |
| The agent kit itself: rules, agents, skills, hooks                      | [.claude/](../.claude/), [CLAUDE.md](../CLAUDE.md)                 |
| Milestones                                                              | the commit history; tag `task-received` marks where the task began |

## Starting point

- **Prepared before the task arrived (2026-11-26 16:31 to 2026-11-27 09:18):** this starter (Next.js 16, Supabase, quality gates, CI, deploy pipeline) and the agent setup described below. No task-specific code. Details in [00-preparation.md](process/00-preparation.md).
- **Built during the 24 hours:** everything after the tag `task-received`: `git diff task-received..main`.

## Tools

| Tool                                          | Used for                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Claude Code (desktop app)                     | Main session: planning, architecture, orchestration                                                              |
| Fable 5.2 / Opus 5.5 / Sonnet 5.5             | Architecture and orchestration / spec and review / parallel implementers                                         |
| `mattpocock-skills` plugin (third party, MIT) | Process spine: grilling, spec, tickets, parallel implementation, TDD, two-axis code review                       |
| Project skills (`.claude/skills/`)            | `design`, `contracts`, `ship`: the phases the plugin does not cover                                              |
| Project agents (`.claude/agents/`)            | `implementer`, `reviewer`, `security-auditor`, `ux-reviewer`, `nextjs-advisor`                                   |
| Project rules (`.claude/rules/`)              | Next.js 16, Supabase, UI and testing conventions, loaded per file path                                           |
| Hooks (`.claude/hooks/`)                      | Format and lint on every edit; lint, typecheck and tests before an agent may finish; no commit or push to `main` |
| Evidence scripts                              | `pnpm evidence:export`: prompts from the session transcripts and issues from GitHub, into `docs/`                |
| MCP servers                                   | next-devtools, context7, shadcn, Playwright, Supabase                                                            |
| Claude Design artifacts                       | Design system and screens, approved before implementation                                                        |

## Phases

The brief was understood once (phases 1 and 2), then built in increments: phases 3 to 9 ran once per increment, each ending in a deployment.

| #   | Phase      | What was used                                                                                                                                              | Output                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Understand | `/grill-with-docs` (Fable 5.2, not the planned Opus 5.5; switched to Opus 5.5 for the last round), four rounds, two research agents, `/to-spec` (Opus 5.5) | [GLOSSARY.md](../GLOSSARY.md), [ADR-0002](adr/0002-background-work-in-the-same-deployable.md), [ADR-0003](adr/0003-pg-cron-drives-the-alerting-tick.md), 31 decisions in the [log](process/decision-log.md), [research-01](process/research-01-slack-oauth-vercel-cron.md), [research-02](process/research-02-event-feeds.md); [spec #2](https://github.com/keserukristof/sonrisa-task/issues/2) |
| 2   | Increments | The spec cut into ordered increments (Opus 5.5), three options put to me, then the plan of attack                                                          | [#3](https://github.com/keserukristof/sonrisa-task/issues/3), [#4](https://github.com/keserukristof/sonrisa-task/issues/4), [#5](https://github.com/keserukristof/sonrisa-task/issues/5), [plan-of-attack](process/plan-of-attack.md)                                                                                                                                                            |
| 3   | Refine     | Increment 1: `mattpocock-skills:grilling` (Opus 5.5), three rounds and 21 decisions, the options for screens shown as inline mockups at my request         | Acceptance criteria in [#3](https://github.com/keserukristof/sonrisa-task/issues/3)                                                                                                                                                                                                                                                                                                              |
| 4   | Design     | `/design`, Claude Design System and Design                                                                                                                 | _docs/design/_                                                                                                                                                                                                                                                                                                                                                                                   |
| 5   | Slice      | `/to-tickets`                                                                                                                                              | _ticket issues_                                                                                                                                                                                                                                                                                                                                                                                  |
| 6   | Contracts  | `/contracts`                                                                                                                                               | _commits_                                                                                                                                                                                                                                                                                                                                                                                        |
| 7   | Build      | `/implement-spec`, parallel `implementer` agents in git worktrees                                                                                          | _pull request_                                                                                                                                                                                                                                                                                                                                                                                   |
| 8   | Review     | `/code-review`, `security-auditor`, `ux-reviewer`                                                                                                          | _findings fixed_                                                                                                                                                                                                                                                                                                                                                                                 |
| 9   | Ship       | `/ship`                                                                                                                                                    | _live URL_                                                                                                                                                                                                                                                                                                                                                                                       |

## Increments

| #   | What a user can do after it                                  | Issue                                                        | Pull request | Shipped |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------ | ------- |
| 1   | Get an email when an earthquake that matters to them happens | [#3](https://github.com/keserukristof/sonrisa-task/issues/3) |              |         |
| 2   | Get alerts in Slack, and about news and market movements too | [#4](https://github.com/keserukristof/sonrisa-task/issues/4) |              |         |
| 3   | An admin sees and runs the whole system                      | [#5](https://github.com/keserukristof/sonrisa-task/issues/5) |              |         |

## Ideas that shaped the setup

- **Thin increments, each shipped.** One grill fixes the scope and the data model for the whole brief. The build then goes slice by slice through design, tickets, contracts, build, review and deploy, so there is a working live version from the first increment on.
- **Contracts before parallel work.** Schema, types, routes, dependencies and design tokens land first and serially; parallel agents then only add files in their own feature folder.
- **Gates are commands, not promises.** A hook runs lint, typecheck and tests before any agent can finish a turn that changed code. CI runs the same script.
- **Fresh eyes review.** Reviewers are separate agents that see only the diff, the spec and the written standards.
- **Docs over memory.** Next.js 16 ships its documentation in the package; the rules send agents there before they write framework code.
- **Design before code.** The look and the screens are approved first and exported into the repo, so every implementer builds the same thing.

## What I decided myself

_The most important entries of the [decision log](process/decision-log.md), summarised at the end: scope cuts, trade-offs, places where I overruled the agents._

## What did not work

_The AI mistakes and shortcuts that were caught, and how: from the decision log and [docs/reviews/](reviews/README.md). The ones from preparation are in [00-preparation.md](process/00-preparation.md#what-went-wrong-and-how-it-was-caught)._
