# #21: The Guardian source

- **State:** closed, closed 2026-11-27 19:44 UTC
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/ai-task/issues/21

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



## Contracts already in place

- A placeholder `guardianSource` in `src/lib/alerting/sources/guardian/index.ts` is already registered with the tick. Replace its `fetch`; keep `id: "guardian"`, `category: "news"` and the interval from `sourceEntry("guardian")` in `src/lib/alerting/sources/catalog.ts` (3 minutes; the credit "Source: The Guardian" is there too).
- The key is `serverEnv().GUARDIAN_API_KEY` (optional: without it, `fetch` throws a clear error, which the tick records as a failed poll). Real polling is the tick's decision (`REAL_POLLING`), not the source's.
- Write the mapper as a pure function, unit-tested on recorded responses committed next to it, like `sources/usgs`. There is no key in this environment, so build the fixtures from the Content API's documented response shape and say so in the fixture file's name or a comment; the user re-records them with a real key before ship.
- External id: the content `id`. Severity `low`. Title, summary (the standfirst, as plain text), URL, `webPublicationDate`.

## Owned paths

- `src/lib/alerting/sources/guardian/**`

## Comments

### keserukristof, 2026-11-27 19:44 UTC

Merged into increment-2 in 1dbb74a; key moved to the documented query parameter in 544d95b. Fixtures are built from the documented shape and must be re-recorded with a real key before ship.

