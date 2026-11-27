# Reviews

Every review an agent produced during the task, saved verbatim, with what was done about each finding. This is the record of how AI output was checked before it was accepted.

## Files

One file per review: `<increment>-<reviewer>.md`, for example `1-code-review.md`, `1-security-auditor.md`, `1-ux-reviewer.md`. An implementer's report that was not accepted as it stood gets a file too: `1-implementer-<ticket>.md`.

## Format

```markdown
# Increment 1: security audit

- **Agent:** security-auditor
- **Reviewed:** <commit range or branch>
- **Date:** 2026-11-27 14:05

## Dispositions

| #   | Finding | Severity | Disposition | Why                               | Fixed in  |
| --- | ------- | -------- | ----------- | --------------------------------- | --------- |
| 1   | ...     | high     | accepted    | ...                               | `abc1234` |
| 2   | ...     | low      | rejected    | the policy already covers it: ... |           |

## Report, verbatim

<the agent's report, unchanged>
```

Disposition is one of **accepted** (fixed), **rejected** (with the reason; this matters most), or **deferred** (written into the README's known limitations).
