# #9: Alerting tick: poll, match, limit, deliver

- **State:** open
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/9

## Body

## Parent

#3

## What to build

The alerting core: one `runTick` that polls due sources, stores events, matches them against active alerts, applies the email limits and delivers pending notifications with retries, plus the tick route the scheduler calls with its own secret. It imports nothing from Next.js and receives its collaborators: database client, sources, channels, clock and configuration.

Stories 30, 32, 35, 36, 38, 39, 60, 61, 62 and 64 of #3. Behaviour: spec #2, "Tick steps".

## Acceptance criteria

- [ ] Integration tests over the local database with fake sources, fake channels and a fake clock, covering every `runTick` case listed under "Tests this increment adds" in #3
- [ ] Matching on category, severity and whole-word, case-insensitive keywords; only alerts created before the event was ingested; paused alerts never match
- [ ] One notification per event and destination
- [ ] Email limits: 10 per user per rolling hour, 80 per UTC day across the system, counting test sends; over a limit the notification is skipped with its reason
- [ ] Retries at 1, 5 and 15 minutes, then failed with the last error
- [ ] Two ticks back to back or at once send each notification once
- [ ] The tick route accepts only the tick secret, compared in constant time, and answers 401 otherwise
- [ ] A source that throws is recorded in source polls and does not stop the others

