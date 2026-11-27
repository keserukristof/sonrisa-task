# #10: USGS earthquake source

- **State:** open
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/10

## Body

## Parent

#3

## What to build

Earthquakes of magnitude 4.5 and above from the USGS past-day feed become events on the common severity scale. A pure mapper turns the feed into event candidates; a fetch gets the feed only when real polling is enabled; recorded responses let everything run locally without the network.

Stories 44–46, 63 and 65 of #3. Rules: "Events and the USGS source" in #3.

## Acceptance criteria

- [ ] Mapper unit tests on recorded responses: every severity boundary, the PAGER raise to at least high, the USGS id as external id, the summary with place, magnitude and depth
- [ ] A malformed item is skipped without throwing; the rest are kept
- [ ] The source implements the Source interface with a one-minute interval
- [ ] No request reaches USGS unless the real-polling flag is set; recorded responses are committed for local development

