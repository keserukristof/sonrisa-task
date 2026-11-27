# #23: Credits and channel-named failure reasons

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/23

## Body

## Parent

#4

## What to build

Every place that shows an event credits its source, and failure reasons name their channel. Story 47 (credits in history and email). Design: `docs/design/screens/notifications.md`, `emails.md`.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] Notification history rows carry the source's credit under the event time; the single USGS line under the list is gone
- [ ] The email footer starts with the source's credit; simulated events have none
- [ ] Stored failure sentences start "The email …" or "The Slack …" and end with a full stop; history shows those and nothing else
- [ ] History shows Slack destinations as "Slack · <name>"
- [ ] Unit tests for the credit in email rendering and history rows

