# Research 02: free feeds for news, markets and natural disasters

Requested 2026-11-27 10:41 during the phase 1 grill, after real feeds were chosen for all three of the brief's examples. A research sub-agent (general-purpose, read-only) was given the main session's beliefs as unverified claims and told to confirm or correct each from the provider's own documentation or terms, and to say "unverified" where it could not. Its report is below, unchanged. The brief it was given is in the [prompt history](../prompts/README.md).

## What changed because of it

- "Real feeds for all three" is weaker than it sounded. No free equities feed passed on terms and quota together, so "market movements" can only mean crypto on a free tier. No general-news feed passed every check in the agent's hands.
- One belief was corrected: the USGS `alert` field is empty on ordinary earthquakes, so it cannot be the everyday severity signal. `mag` or `sig` has to be.
- A per-minute poll does not fit every feed: CoinGecko's Demo key allows 10,000 calls a month, which is one call every five minutes.

## Follow-up check by the main session

The agent could not read the Guardian Open Platform's terms because the site refused its fetch tool. The main session opened https://open-platform.theguardian.com/access/ in a browser at 10:55 and read: the Developer key is "for any non-commercial usage", "Up to 1 call per second", "Up to 500 calls per day", "Free for non-commercial usage". A poll every three minutes is 480 calls a day. Whether an article carries any importance signal was not checked.

## The report, verbatim

Legend: doc = stated on the provider's page; obs = seen in one direct fetch today; unv = unverified. One poll a minute is 1,440 calls/day.

**Natural disasters**

| Feed         | Key                     | Limits | Terms                                                    | Signal                                                                      | Freshness                              | URL                                                           |
| ------------ | ----------------------- | ------ | -------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| USGS GeoJSON | none (obs; docs silent) | unv    | public domain; credit "U.S. Geological Survey" requested | `mag`, `sig` 0–1000, `alert` (PAGER green–red)                              | doc: "Updated every minute"            | https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php |
| GDACS RSS    | none (obs)              | unv    | disclaimers only, no attribution clause                  | `gdacs:alertlevel` Green/Orange/Red, `alertscore`; quakes, cyclones, floods | doc: every 6 min                       | https://www.gdacs.org/feed_reference.aspx                     |
| EONET v3     | none (obs)              | unv    | "visualization and general information purposes only"    | optional `magnitudeValue`; no alert level                                   | unv; obs: newest open event 6 days old | https://eonet.gsfc.nasa.gov/docs/v3                           |

**News**

| Feed          | Key        | Limits                                                      | Terms                                        | Signal                 | Freshness             | URL                                     |
| ------------- | ---------- | ----------------------------------------------------------- | -------------------------------------------- | ---------------------- | --------------------- | --------------------------------------- |
| NewsAPI       | yes        | 100/day                                                     | Developer plan: no staging or production use | none                   | 24 h delay            | https://newsapi.org/pricing             |
| GNews         | yes        | 100/day                                                     | non-commercial; production unv               | none                   | 12 h delay            | https://gnews.io/pricing                |
| GDELT DOC 2.0 | unv        | "rate limited", no figure; obs: HTTP 429 on both test calls | free for any use; must cite and link GDELT   | none per article       | unv                   | https://www.gdeltproject.org/about.html |
| Hacker News   | none (obs) | doc: "currently no rate limit"                              | MIT repo, no attribution clause              | `score`, `descendants` | doc: "near real time" | https://github.com/HackerNews/API       |

**Markets**

| Feed          | Key                                | Limits                                                        | Terms                                                                  | Signal                                           | Freshness                                       | URL                                      |
| ------------- | ---------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- | ---------------------------------------- |
| Finnhub       | yes (obs: 401 without)             | unv                                                           | "strictly for personal use"; no sharing "data or derived results"      | unv                                              | unv                                             | https://finnhub.io/terms-of-service      |
| Alpha Vantage | yes                                | 25/day                                                        | unv                                                                    | unv                                              | realtime and 15-min-delayed US data are premium | https://www.alphavantage.co/support/     |
| CoinGecko     | free Demo key; keyless works (obs) | Demo 100/min, 10,000 calls/month; keyless 5–15/min, IP-shared | "Powered by CoinGecko" required; no commercial licence listed for Demo | `price_change_percentage_1h_in_currency`, `_24h` | doc: "from 60 sec"; obs: 1 min old              | https://www.coingecko.com/en/api/pricing |
| Twelve Data   | yes                                | 8 credits/min, 800/day                                        | "Internal non-display usage"; external display needs authorization     | unv                                              | real-time US equities, forex, crypto            | https://twelvedata.com/pricing           |

Other pages read: USGS field definitions (https://earthquake.usgs.gov/data/comcat/data-eventterms.php), https://newsapi.org/terms, https://www.coingecko.com/en/api_terms, https://twelvedata.com/terms, https://www.gdacs.org/About/termofuse.aspx.

**Your beliefs**

- **USGS:** confirmed, with one correction. `alert` was null on every ordinary quake in `all_hour` and set on all 12 in `significant_month`, so `sig` or `mag` is the everyday signal.
- **NewsAPI:** confirmed (no production use, 24 h delay).
- **Alpha Vantage:** confirmed (25/day).
- **CoinGecko:** confirmed, both keyless and Demo.

**Recommendations**

- **Disasters: USGS.** It is the only feed documented as updating every minute, and it carries three severity fields. GDACS is the multi-hazard alternative at a 6-minute cadence.
- **Markets: CoinGecko with a Demo key, crypto only.** Make one batched `/coins/markets` call every 5 minutes (about 8,900 a month); a per-minute poll exhausts the 10,000 monthly calls in a week. Show "Powered by CoinGecko". No equities feed passed: Finnhub and Twelve Data fail on terms, Alpha Vantage on quota and freshness.
- **News: no clean general-news winner among what I could verify.** Hacker News is the only feed that passes every check and has an importance signal, but it is tech-only. Check the Guardian by hand before settling.

**Could not verify**

- **Guardian Open Platform and BBC RSS terms:** both sites refuse the fetch tool; I did not work around it.
- **Stooq:** pages returned empty.
- **Finnhub rate limits, quote fields and freshness:** the docs render by script. A search snippet said 60 calls/min, but I never read the page.
- **GDELT:** key requirement, rate figure and freshness. The 429s came from the fetch tool's shared address, so they show throttling exists, not what your deployment would get.
- **USGS and GDACS polling limits:** the USGS policy page returned 404.
- **EONET:** update cadence and rate limits.
- **CoinGecko:** Demo header name, per-endpoint cache interval, and any monthly cap on keyless use.
- **NPR RSS (added candidate):** the feed is keyless and minutes old (obs), but its terms page timed out.
