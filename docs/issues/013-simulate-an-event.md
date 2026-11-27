# #13: Simulate an event

- **State:** open
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/13

## Body

## Parent

#3

## What to build

An admin creates a simulated event by choosing its category, severity, title and optional summary and link. The event is stored, marked simulated, and left for the next scheduled tick; nothing is sent from the action.

Stories 58 and 59 of #3. Screen: `docs/design/screens/admin-simulate.md`.

## Acceptance criteria

- [ ] Everything under "Admin slice (stories 58–60)" in #3's acceptance criteria except the delivery, which is #14's
- [ ] `/admin` redirects to `/admin/simulate`; a non-admin or signed-out visitor gets the not-found page
- [ ] The action re-checks the admin role and validates with the shared Zod schema; news is forced to low
- [ ] Success shows the "Event created" notice and resets the form

