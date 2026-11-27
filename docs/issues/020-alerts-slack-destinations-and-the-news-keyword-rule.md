# #20: Alerts: Slack destinations and the news keyword rule

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/20

## Body

## Parent

#4

## What to build

The alert form offers Slack destinations beside the account email, the alerts list marks a broken destination by name, and news alerts need at least one keyword. Stories 15 (alerts side) and 41 (the rule). Design: `docs/design/screens/alerts-list.md`, `alert-form.md`.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] The form lists every destination as a checkbox, Slack ones by name with a broken mark where broken
- [ ] The alerts list names every destination of an alert and marks a broken one as "<name> (broken)"
- [ ] For News, Keywords is required, with the designed hint; with none, the form shows "News alerts need at least one keyword, or every article would notify you."
- [ ] Resuming a keyword-less news alert is refused and the switch reverts with the designed message
- [ ] Playwright specs on both projects

