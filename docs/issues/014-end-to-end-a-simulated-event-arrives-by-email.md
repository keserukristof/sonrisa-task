# #14: End to end: a simulated event arrives by email

- **State:** open
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/14

## Body

## Parent

#3

## What to build

The whole path works end to end: the tick route runs `runTick` with the real USGS source and the real email channel, so an admin's simulated event is matched, sent and shown as sent, and the email arrives in the local mail catcher.

Story 60 of #3, and the proof for stories 32, 33, 35 and 61.

## Acceptance criteria

- [ ] The tick route builds the production collaborators: the USGS source, the email channel, the system clock and the configured limits
- [ ] Playwright spec with an axe scan: an admin with a matching alert simulates an event, a tick runs against the local stack, the notification shows as sent with the Simulated badge, and the email with the `[SIMULATED]` subject is in the mail catcher
- [ ] Locally the `pg_cron` job reaches the tick route and a tick runs without anyone visiting the site

