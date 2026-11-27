# #22: CoinGecko source

- **State:** open
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

