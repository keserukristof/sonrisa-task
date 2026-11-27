# #19: Slack destinations: add, test, broken and remove

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/19

## Body

## Parent

#4

## What to build

A user connects Slack channels on `/destinations`: adds one by name and webhook URL on its own page, sees it by name and hint only, sends a test, sees it marked broken when Slack says it is gone, and removes it unless it is some alert's only destination. Stories 9–16. Design: `docs/design/screens/destinations.md`, `add-slack-destination.md`.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] `/destinations/slack/new` adds a destination with every error in the design, the 10-destination limit included; success returns to `/destinations` with its notice
- [ ] Rows show the name, "Slack" and the hint; the URL never reaches the browser
- [ ] Send test works for Slack: delivered, transient failure, the 5-per-day limit, and a permanent answer that marks the destination broken with its reason; a successful test returns a broken destination to active
- [ ] A broken destination shows "Broken" with its reason, by text and icon
- [ ] Remove opens the confirmation; a refusal shows inside the dialog as designed; focus behaves as designed
- [ ] Playwright specs on both projects against the Slack stub, broken state included

