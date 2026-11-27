# #25: Admin lists: users and notifications

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/25

## Body

## Parent

#4

## What to build

Admins see every user with role, sign-up date and alert count, and every notification with owner, destination type, status, attempts and reason, filterable by status. Stories 49, 52. Design: `docs/design/screens/admin-lists.md`.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] Users: email, role, sign-up date, number of alerts; 25 per page, newest first
- [ ] Notifications: event, owner's email, destination type, status, attempts, failure or skip reason; 25 per page, newest first
- [ ] The status filter (All, Pending, Sent, Failed, Skipped) lives in `?status=`; an unknown value shows All; the pager keeps the filter
- [ ] Empty, loading and error states as designed
- [ ] A non-admin gets the not-found page; Playwright specs on both projects

