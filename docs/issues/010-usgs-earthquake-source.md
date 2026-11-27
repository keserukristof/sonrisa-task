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


## Contracts already in place

- Implement the `Source` interface from `src/lib/alerting/types.ts`: id `usgs`, category `natural_disasters`, `intervalSeconds` 60. Export the pure mapper from the feed's JSON to `EventCandidate[]` separately from the fetch.
- The source does not decide whether polling is on and never touches the database: the tick calls `fetch` only when real polling is enabled. Do not read environment variables in the source.
- Parse the feed with Zod; an item that does not parse is skipped, not thrown.
- Recorded responses are committed as JSON files next to the mapper tests. Record them once by hand from the USGS past-day feed of magnitude 4.5 and above; tests never call the network.

## Owned paths

- `src/lib/alerting/sources/usgs/**`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, never write through the demo accounts, and read mail with `waitForEmail()` from `e2e/support/mailbox.ts`. Remove your page's `<Placeholder>`.

