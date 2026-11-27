# #26: Admin events list

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/26

## Body

## Parent

#4

## What to build

Admins see every event with source, category, severity, time, the Simulated badge and the source credit. Story 51. Design: `docs/design/screens/admin-lists.md`. Second to cut under the fallback.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] Events: title, source, category, severity, time in UTC, Simulated badge, credit; 25 per page, newest first
- [ ] Empty, loading and error states as designed
- [ ] A non-admin gets the not-found page; Playwright specs on both projects

