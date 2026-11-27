# #12: Notification history

- **State:** open
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/12

## Body

## Parent

#3

## What to build

A user sees their notification history, newest first, 25 a page: the event with its time, the alert or "Deleted alert", the destination, the severity, and the status with its reason. Simulated events carry the Simulated badge.

Stories 37, 39 and 40 of #3. Screen: `docs/design/screens/notifications.md`.

## Acceptance criteria

- [ ] Everything under "History (37)", "Limits (38, 39)" display and "Empty state (40)" in #3's acceptance criteria
- [ ] A user sees only their own notifications
- [ ] Pager with Previous and Next on `?page=`; a bad page number shows the first page
- [ ] Loading, empty, error and success states, stacked rows at 360px
- [ ] Playwright spec with an axe scan over the seeded history

