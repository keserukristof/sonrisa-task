# #7: Sign up, confirm and sign in

- **State:** open
- **Opened:** 2026-11-27 14:19 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/7

## Body

## Parent

#3

## What to build

A visitor can sign up, see that their account is waiting for confirmation, confirm through the emailed link and land signed in on their alerts; a user can sign in, see clear errors, be returned to the page they asked for, and sign out. The signed-out landing page explains Heads-up.

Stories 1–7 of #3. Screens: `docs/design/screens/landing.md`, `sign-up.md`, `sign-up-confirm.md`, `sign-in.md`, `link-expired.md`.

## Acceptance criteria

- [ ] Everything under "Account (stories 1–7)" in #3's acceptance criteria
- [ ] Signing up with an existing address shows the same waiting page
- [ ] The confirmation link signs the visitor in and shows "Email confirmed." on `/alerts`; an expired or used link shows its page
- [ ] `next` accepts only a path on this site; anything else goes to `/alerts`
- [ ] Playwright spec with an axe scan: sign up, confirm through the local mail catcher, sign in, sign out; wrong password shows the error

