# Issue tracker: GitHub

Specs and tickets for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Make an issue a sub-issue of a parent**: `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). If sub-issues are unavailable, put `Part of #<parent>` at the top of the child body.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Project conventions

Three levels: spec, then increments, then tickets.

- The **spec** is one issue for the whole brief. It stays open until the last increment has shipped, then it is closed by hand.
- An **increment** is a sub-issue of the spec, titled `Increment <n>: <what a user can do once it ships>`. Its body lists the spec user stories it delivers, then the acceptance criteria from the Refine phase. Each increment is blocked by the one before it.
- A **ticket** is a sub-issue of its increment. Pass the increment, never the spec, to the plugin skills: `/to-tickets #<increment>`, `/implement-spec #<increment>`.
- **Ticket 1 of every increment is "Contracts"** and blocks that increment's other tickets (see the `contracts` skill).
- Each ticket body ends with an **Owned paths** list, written during the Contracts phase. An implementer edits nothing outside it.
- Each increment lands on its own integration branch, `increment-<n>`, cut from `main` after the previous increment merged. One pull request per increment closes the increment and its tickets, and leaves the spec open.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Blocking

GitHub's **native issue dependencies** are the canonical representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, not the `#number`). Where dependencies are not available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
