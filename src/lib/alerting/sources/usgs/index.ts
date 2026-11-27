import type { Source } from "@/lib/alerting/types";
import { mapUsgsFeed } from "./map";

export const USGS_FEED_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";

/**
 * Earthquakes of magnitude 4.5 and above from the past day. Whether to poll
 * is the tick's decision (the real-polling flag); this source only fetches.
 */
export const usgsSource: Source = {
  id: "usgs",
  category: "natural_disasters",
  intervalSeconds: 60,
  async fetch() {
    const response = await fetch(USGS_FEED_URL, {
      headers: { accept: "application/geo+json, application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`USGS feed answered ${response.status}`);
    }
    return mapUsgsFeed(await response.json());
  },
};
