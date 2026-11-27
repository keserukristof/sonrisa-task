import { serverEnv } from "@/lib/env.server";
import type { Source } from "@/lib/alerting/types";
import { sourceEntry } from "../catalog";
import { mapCoingeckoMarkets } from "./map";

export const COINGECKO_MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&price_change_percentage=1h,24h";

/**
 * The top 20 coins by market cap with their 1-hour change, in one call.
 * Whether to poll is the tick's decision (the real-polling flag); this
 * source only fetches. The 6-hour rule per coin lives in the database.
 */
export const coingeckoSource: Source = {
  id: "coingecko",
  category: "markets",
  intervalSeconds: sourceEntry("coingecko")?.intervalSeconds ?? 300,
  async fetch(now) {
    const key = serverEnv().COINGECKO_API_KEY;
    if (!key) throw new Error("COINGECKO_API_KEY is not set");
    const response = await fetch(COINGECKO_MARKETS_URL, {
      headers: { accept: "application/json", "x-cg-demo-api-key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`CoinGecko answered ${response.status}`);
    }
    return mapCoingeckoMarkets(await response.json(), now);
  },
};
