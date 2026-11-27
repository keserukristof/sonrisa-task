# #21: The Guardian source

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/21

## Body

## Parent

#4

## What to build

Articles from the Guardian's world, business and environment sections become low-severity news events, polled every 3 minutes in production only. Story 41. Behaviour: spec #2.

## Acceptance criteria

- [ ] The source implements the Source interface; its mapper is a pure function unit-tested on recorded responses committed to the repository
- [ ] Only the three sections; external id is the Guardian content id; severity Low; category News
- [ ] Registered with the tick; real polling only when the production flag and the key are present
- [ ] No test calls the Guardian

