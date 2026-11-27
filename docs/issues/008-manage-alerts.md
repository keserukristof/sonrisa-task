# #8: Manage alerts

- **State:** open
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/8

## Body

## Parent

#3

## What to build

A user can see their alerts, create one by choosing a name, category, minimum severity, optional keywords and destinations, edit it, pause and resume it in one click, and delete it after confirming.

Stories 18–31 of #3 (story 20 brought forward). Screens: `docs/design/screens/alerts-list.md`, `alert-form.md`.

## Acceptance criteria

- [ ] Everything under "Alerts" in #3's acceptance criteria, except matching, which is the tick's
- [ ] Every Server Action re-checks the user and validates with the shared Zod schema
- [ ] Loading, empty, error and success states as designed, at 360px and desktop
- [ ] Editing keeps the creation time; another user's alert gives the not-found page
- [ ] Playwright spec with an axe scan: create, edit, pause, resume and delete an alert; a form without a destination shows the field error

