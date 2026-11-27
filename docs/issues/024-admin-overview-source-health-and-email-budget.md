# #24: Admin overview: source health and email budget

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/24

## Body

## Parent

#4

## What to build

`/admin` shows each source's last poll, outcome, events stored and status (OK, Late, Failing), or "Not polled in this environment", and today's email budget with test sends. Stories 53, 54. Design: `docs/design/screens/admin-overview.md`. Source health is third to cut under the fallback.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] One row per source with the designed status rules: Late after three intervals (USGS 3 minutes, the Guardian 9, CoinGecko 15), Failing when the last poll failed, Failing over Late, never polled shown as Late
- [ ] "Not polled in this environment" when real polling is off
- [ ] "N of 80 emails sent today (UTC)" with the meter, and "M of 20 test sends"
- [ ] Each section has its own loading and error state
- [ ] A non-admin gets the not-found page; Playwright specs on both projects

