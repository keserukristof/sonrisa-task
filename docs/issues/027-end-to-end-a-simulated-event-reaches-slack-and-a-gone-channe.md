# #27: End to end: a simulated event reaches Slack, and a gone channel turns broken

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/27

## Body

## Parent

#4

## What to build

The whole path through Slack, proven in the browser against the local stub: an alert to a Slack destination, a simulated event, the tick, a delivered message; then the stub answers "channel not found" and the destination shows as broken on `/destinations` and `/alerts`. Stories 15, 34, 60.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] A Playwright spec on both projects: create a Slack destination on the stub, an alert using it, simulate a matching event, run the tick, and see the stub receive the Block Kit message and history show Sent
- [ ] With the stub set to a permanent error, the next delivery fails with the Slack reason and the destination shows Broken with its reason on `/destinations` and "(broken)" on `/alerts`
- [ ] The test creates and deletes its own account

