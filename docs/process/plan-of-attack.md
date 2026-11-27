# Plan of attack

**Status:** written 2026-11-27 12:30, after the grill (phase 1) and the increment cut (phase 2), before any feature code. Approved by me in this session; the evidence is in the [decision log](decision-log.md) and the [prompt history](../prompts/README.md).

The brief asks for this plan explicitly: which deliverables the brief requires, in what order, and why. It was written from the grill's outcome, not before it, because the grill is where the brief's open questions were answered.

## Deliverables

The brief grades how the result was reached, so the process artefacts are deliverables in their own right, not by-products.

| Deliverable                                                      | Where                                                                                                                                                                                    | Why the brief needs it                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| The brief's open questions answered, with who answered and why   | [decision-log.md](decision-log.md), [GLOSSARY.md](../../GLOSSARY.md)                                                                                                                     | "No agreement on what 'something important' means, where the data comes from…" |
| Architecture decisions that are hard to reverse                  | [docs/adr/](../adr/)                                                                                                                                                                     | "What decisions you made and why"                                              |
| Facts checked against primary sources before they were relied on | [research-01](research-01-slack-oauth-vercel-cron.md), [research-02](research-02-event-feeds.md)                                                                                         | "How you evaluated the validity of what the AI produced"                       |
| One spec for the whole brief                                     | [#2](https://github.com/keserukristof/sonrisa-task/issues/2), exported in [docs/issues/](../issues/README.md)                                                                            | From ambiguity to something buildable                                          |
| Ordered increments, each shipped before the next starts          | [#3](https://github.com/keserukristof/sonrisa-task/issues/3), [#4](https://github.com/keserukristof/sonrisa-task/issues/4), [#5](https://github.com/keserukristof/sonrisa-task/issues/5) | "A partial but well-reasoned solution beats a complete but undocumented one"   |
| Approved screen designs, before implementation                   | [docs/design/](../design/README.md)                                                                                                                                                      | No wireframes were given                                                       |
| Review reports with a disposition for every finding              | [docs/reviews/](../reviews/README.md)                                                                                                                                                    | "The code you rewrote or rejected"                                             |
| The working application, live and runnable locally               | https://sonrisa-task.vercel.app, `README.md`                                                                                                                                             | "Your deliverables, as defined by your own plan"                               |
| Every prompt, and every brief sent to a sub-agent                | [docs/prompts/](../prompts/README.md)                                                                                                                                                    | "Your prompt history: all prompts used"                                        |
| A commit per milestone, merged without squashing                 | the history of `main`                                                                                                                                                                    | "Commits for each major milestone"                                             |
| The write-up: what I decided, what went wrong, how it was caught | [docs/ai-workflow.md](../ai-workflow.md)                                                                                                                                                 | "Where you course-corrected"                                                   |

Deliberately left out of the product, with the reasons in the decision log: Slack OAuth, password reset, teams, equities, natural disasters other than earthquakes, admin operations beyond promotion and simulation, a public API. The full list is the spec's Out of Scope.

## Order

| #   | What a user can do once it ships                             | What it proves                                                                                                | Target      |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Get an email when an earthquake that matters to them happens | The whole engine end to end: scheduler, tick, outbox, one source, one channel, limits, retries, RLS           | 12:45–17:00 |
| 2   | Get alerts in Slack, and about news and market movements too | The brief's "flexible enough that we can add more channels": a second channel and two sources, core unchanged | 17:00–20:30 |
| 3   | An admin sees and runs the whole system                      | The brief's "admin view", over data the first two increments produce                                          | 20:30–23:00 |
| —   | Final write-up, README, evidence export, reviewer access     |                                                                                                               | 23:00–00:00 |

If increment 1 runs past 17:30, increments 2 and 3 merge into one smaller increment. Scope freezes at 05:30; the deadline is 09:30.

## Why this order

- **The riskiest part goes first.** Everything that could sink the product sits in increment 1:
  - the scheduler path from `pg_cron` through `pg_net` to a Vercel route (checked locally, not yet in production);
  - the outbox, with retries and idempotency;
  - the email provider's domain verification;
  - Row Level Security for per-user data.

  A failure there is found at 17:00, not at midnight.

- **The most valuable flow ships first.** An email for an event the user chose is the brief's core promise. After increment 1 there is a working, deployed product even if nothing else lands.
- **Simulation rides with increment 1.** Without it, nobody can see an alert fire on demand: the reviewer, the end-to-end test, or me checking production. It costs a thin slice of the admin role early.
- **The extensibility claim is tested, not asserted.** Increment 2 adds a channel and two sources. If either needs a change to the alerting core, the review catches it as a broken promise.
- **The admin view comes last.** It is read-mostly and consumes what the others produce. It is also the easiest to cut if time runs out, because the grill already limited it to seeing, promotion and simulation.

## How AI output is validated

Every phase has a check that does not depend on trusting the agent's own report:

| Phase          | Check before the output is accepted                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grill and spec | Options with a marked recommendation, decided by me. Agent claims (vendor limits, terms, what works locally) go to research agents as unverified beliefs, and are checked against primary sources or by running the thing. |
| Design         | I approve the screens before tickets are cut.                                                                                                                                                                              |
| Contracts      | `security-auditor` reviews the schema and policies, and pgTAP tests prove them.                                                                                                                                            |
| Build          | Tests come first (`/tdd`) at the seams the spec agreed. `pnpm verify` runs from a hook before an agent can finish, and CI runs it on every push. Implementer reports are read against the diff, not taken as stated.       |
| Review         | `/code-review` (standards and spec, fresh context), `security-auditor` and `ux-reviewer` in a real browser. Every finding gets a disposition in `docs/reviews/`.                                                           |
| Ship           | Production is checked after the deploy: a simulated event in production must produce a delivered email, with a screenshot as evidence.                                                                                     |
| Throughout     | Every rejection, correction and overrule becomes a row in the decision log when it happens.                                                                                                                                |

Corrections already made in phase 1, as examples:

- The question format was rejected and the round re-asked.
- A belief about the USGS alert field was corrected by research.
- My own email-limit recommendation could not hold the shared quota, and was replaced.
- Four log rows that claimed more than was said or checked were rewritten before the commit.
