# Preparation: before the task arrived

The task arrived on 2026-11-27 at 09:30. Its content was unknown before then; the invitation said only that it would be developed with AI and judged on how. This page records what was prepared in the 17 hours before, why, and what went wrong along the way.

- **Boundary in git:** the tag `task-received` marks commit `319234e`, the last commit before the task. `git diff task-received..main` shows everything built during the 24 hours.
- **Nothing task-specific was prepared.** The starter has one table, a health check, and no feature code.

## What was prepared

| Piece           | What it is                                                                                                   | Commit               |
| --------------- | ------------------------------------------------------------------------------------------------------------ | -------------------- |
| Starter         | Next.js 16 and Supabase, quality gates (`pnpm verify`), CI, a health check                                   | `7299ebf`            |
| Agent kit       | `CLAUDE.md` workflow, path-scoped rules, the `design`, `contracts` and `ship` skills, five agents, two hooks | `ca2e3d6`            |
| Deploy pipeline | Vercel project and Supabase cloud project, live and verified                                                 | `4a97480`, `783a06f` |
| Increment loop  | The build reworked into thin increments, each shipped                                                        | `607ebce`            |
| Rehearsal fixes | Defects the rehearsal found, fixed                                                                           | `319234e`            |

## Timeline

**2026-11-26**

| Time           | Session                            | What happened                                                                                                                                                                                                                                                                     |
| -------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16:31          | Preparation (`dec9ad2e`)           | Asked for a structured, parallel, agentic setup for a Next.js app, built together before the task is known. A `claude-code-guide` agent verified Claude Code's skill, agent, hook and worktree features against the docs instead of relying on memory.                            |
| 16:41          | Same                               | Questioned the proposal of all-custom skills: why not Matt Pocock's? Renamed the folder to `sonrisa-task`, accepted the deploy idea.                                                                                                                                              |
| 17:00          | Preparation, forked (`fe2dc792`)   | Set the model map (architecture on Fable, spec and review on Opus), one compact write-up, a Claude Design step before implementation, UI and UX guidelines and specialist agents. Chose the hybrid kit: the plugin as the process spine, custom pieces only where it has nothing. |
| 17:10          | Same                               | A research agent digested the Next.js 16 docs bundled in the package, marking anything it could not find in them. The project rules were written from that digest.                                                                                                                |
| 17:46          | Same                               | Starter committed (`7299ebf`), then the agent kit (`ca2e3d6`).                                                                                                                                                                                                                    |
| 17:55          | Non-interactive check (`da29598f`) | A headless `claude -p` run listed the skills, agents and MCP servers a fresh session actually sees.                                                                                                                                                                               |
| 18:28 to 19:44 | Preparation                        | Four fixes from running the kit for real (see below).                                                                                                                                                                                                                             |
| 19:03          | Non-interactive check (`d02962b0`) | A headless run launched an `implementer` to confirm it really gets its own git worktree.                                                                                                                                                                                          |
| 19:18          | Preparation                        | The disk was 98% full and Docker failed. Agent worktrees no longer in use were deleted, with approval.                                                                                                                                                                            |
| 20:20          | Preparation                        | The Supabase cloud project `ai-task` was created by hand, and the CLI logins were done by hand.                                                                                                                                                                                   |
| 20:26          | Autonomy (`954c8b81`)              | Asked for no permission prompts inside this project. Set `bypassPermissions` locally with a shell command typed by hand.                                                                                                                                                          |
| 20:26          | Architecture (`a47cf6b8`)          | Reviewed the planned architecture; agreed that the concrete structure waits for the task.                                                                                                                                                                                         |
| 20:27          | Specialist agents (`166db5a1`)     | Asked which advisor agents to add; `nextjs-advisor` was created and smoke-tested.                                                                                                                                                                                                 |
| 20:28          | MCP servers (`b2911e5c`)           | Listed the configured MCP servers.                                                                                                                                                                                                                                                |
| 20:32          | Preparation                        | The starter went live at https://sonrisa-task.vercel.app (`783a06f`).                                                                                                                                                                                                             |
| 20:36          | Disk space (`fc0e79b9`)            | More disk space freed, deleting caches item by item with approval.                                                                                                                                                                                                                |
| 20:58          | Preparation                        | Decided to rehearse the kit the next morning.                                                                                                                                                                                                                                     |

**2026-11-27**

| Time  | Session                  | What happened                                                                                                                                                |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 08:42 | Next steps (`512500ba`)  | Asked what happens once the task arrives. Pushed back on one big grill and one big design for the whole brief as "a bit much", and asked where tickets live. |
| 08:46 | Same                     | The workflow was rewritten into shipped increments, and the must/should/could tiers were dropped: everything agreed in the grill is Must (`607ebce`).        |
| 08:47 | Permissions (`03f16e8e`) | Asked why commands still needed approval after the autonomy change.                                                                                          |
| 08:48 | Preparation              | "No rehearsal, it will work live."                                                                                                                           |
| 09:05 | Same                     | Changed to one short rehearsal: two throwaway tickets run by `implementer` agents in parallel worktrees.                                                     |
| 09:18 | Same                     | Rehearsal findings fixed and pushed (`319234e`).                                                                                                             |
| 09:30 |                          | The task arrived.                                                                                                                                            |

## Decisions and why

| Decision                                                                  | Why                                                                                                                                                            |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js for frontend and backend, Supabase as the database                | One language and one deployable; Row Level Security keeps authorization next to the data. Recorded in [ADR-0001](../adr/0001-architecture-baseline.md).        |
| A deployed instance and a one-command local setup                         | Reviewers can try it in minutes either way.                                                                                                                    |
| Hybrid kit: `mattpocock-skills` as the spine, custom skills only for gaps | A known, documented process instead of an invented one; the custom parts (design, contracts, ship, Next.js and Supabase rules) cover what the plugin does not. |
| A different model per phase                                               | The strongest model for architecture, a careful one for spec and review, a fast one for parallel implementers.                                                 |
| Contracts before parallel work                                            | Parallel agents share one database, one lockfile and one stylesheet. Shared changes land first, serially, so the parallel tickets cannot collide.              |
| Design approved before code                                               | The look and the screens are seen and agreed before an agent builds them.                                                                                      |
| Thin increments, each shipped                                             | One big pass felt like too much. Each increment ends live, so there is always a working version.                                                               |
| No priority tiers                                                         | What the grill agrees is the scope; what it does not is out of scope, written down.                                                                            |
| Gates as hooks                                                            | No agent can finish a turn while lint, typecheck or tests fail on its changes. "Done" is checked, not claimed.                                                 |
| Agents cannot touch the cloud database                                    | `db push` and deploys need approval each time; `db reset` against the cloud is denied outright.                                                                |

## What went wrong, and how it was caught

These are the AI mistakes and wrong assumptions found during preparation. Each was caught by running something, not by reading the output.

| Problem                                                                                                                  | How it showed up                                                      | Fix                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| CI set a placeholder Supabase key for the whole workflow, which overrode the real local key in the e2e job               | The health check reported "degraded" in CI                            | Placeholder scoped to the verify job (`a3c310d`)                                                 |
| E2E tests ran against whatever answered on port 3000, which was another project's dev server                             | False test failures                                                   | E2E builds and serves its own production build on its own port, derived per worktree (`b6d47ed`) |
| Docker had too little memory for the full local Supabase stack                                                           | Docker has little memory to spare beside another project's containers | `pnpm bootstrap --lite` starts only what the app uses (`b6d47ed`)                                |
| Supabase CLI 3.x points database commands at the local stack unless `--remote` is passed                                 | The planned ship commands would have targeted the wrong database      | Ship skill, rules and deny list updated (`4a97480`)                                              |
| The disk was 98% full                                                                                                    | Docker broke                                                          | Space freed, with each deletion approved                                                         |
| Both rehearsal implementers skipped the TDD skill, one "to stay under the time target", and did red and green by hand    | Their own reports said so                                             | The implementer must load the TDD skill even for small tickets (`319234e`)                       |
| Implementers tried `ls .env.local`, which the deny rules block, and long compound shell commands, which worktrees refuse | Their reports listed the blocked commands                             | Check the file with `test -f`; one command per Bash call (`319234e`)                             |
| `supabase gen types --local` is deprecated in CLI 3.x                                                                    | Found during the rehearsal                                            | Flag dropped (`319234e`)                                                                         |
| Permission prompts kept appearing after autonomy was granted                                                             | The user had to approve commands                                      | Investigated in session `03f16e8e`                                                               |

## What the rehearsal did not cover

Only the parallel implementers and `nextjs-advisor` were exercised before the task. These ran for the first time during the task:

- `/design` with Claude Design artifacts
- the `reviewer`, `security-auditor` and `ux-reviewer` agents
- `/ship` per increment
