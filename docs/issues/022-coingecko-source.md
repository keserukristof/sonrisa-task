# #22: CoinGecko source

- **State:** closed, closed 2026-11-27 19:44 UTC
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/22

## Body

## Parent

#4

## What to build

Crypto moves of the top 20 coins by market cap become market events when a coin's 1-hour change crosses ±3%, at most one per coin per 6 hours. Stories 42, 43. Behaviour: spec #2 and #4. First to cut under the fallback.

## Acceptance criteria

- [ ] The source implements the Source interface; its mapper is unit-tested on recorded responses committed to the repository
- [ ] Top 20 by market cap; an event only when the 1-hour change is at least +3% or at most −3%
- [ ] At most one event per coin per 6 hours
- [ ] Title "Bitcoin (BTC) up 4.2% in the past hour" or "down 3.6%"; summary "Price $64,210. 24-hour change −1.8%."; link to the coin's CoinGecko page; severity mapped as spec #2 says
- [ ] Registered with the tick; the Demo key sent in CoinGecko's demo header; real polling only in production; no test calls CoinGecko



## Contracts already in place

- A placeholder `coingeckoSource` in `src/lib/alerting/sources/coingecko/index.ts` is already registered with the tick. Replace its `fetch`; keep `id: "coingecko"`, `category: "markets"` and the interval from `sourceEntry("coingecko")` (5 minutes; credit "Powered by CoinGecko").
- **External id must be `<coin id>:<something unique per poll>`**, for example `bitcoin:2026-11-27T18:05`. The database (trigger `events_skip_repeated_market_event`) drops a CoinGecko event for a coin that already has one in the 6 hours before it, by the part before the colon. So the source reports every crossing and the 6-hour rule needs no state here.
- The key is `serverEnv().COINGECKO_API_KEY`, sent in the `x-cg-demo-api-key` header. Real polling is the tick's decision.
- The mapper is a pure function, unit-tested on recorded responses committed next to it. There is no key in this environment, so build the fixtures from the documented `/coins/markets` response shape (with `price_change_percentage=1h,24h`) and say so; the user re-records them before ship.
- Copy: title "Bitcoin (BTC) up 4.2% in the past hour" / "down 3.6%" (one decimal, symbol upper case); summary "Price $64,210. 24-hour change −1.8%." (US dollars, the true minus sign); link `https://www.coingecko.com/en/coins/<id>`. Severity as spec #2 maps it.

## Owned paths

- `src/lib/alerting/sources/coingecko/**`

## Comments

### keserukristof, 2026-11-27 19:44 UTC

Merged into increment-2 in cee9444. Host and demo header checked against CoinGecko's docs. Fixtures are built from the documented shape and must be re-recorded with a real key before ship.

