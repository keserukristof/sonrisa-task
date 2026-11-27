import "server-only";
import { serverEnv } from "@/lib/env.server";
import type { Source } from "@/lib/alerting/types";
import { sourceEntry } from "../catalog";
import { GUARDIAN_SECTIONS, mapGuardianSearch } from "./map";

export const GUARDIAN_SEARCH_URL = "https://content.guardianapis.com/search";

/**
 * Newest articles of the world, business and environment sections. Whether to
 * poll is the tick's decision (the real-polling flag); this source only
 * fetches, and throws a clear error when the key is missing.
 */
export const guardianSource: Source = {
  id: "guardian",
  category: "news",
  intervalSeconds: sourceEntry("guardian")?.intervalSeconds ?? 180,
  async fetch() {
    const key = serverEnv().GUARDIAN_API_KEY;
    if (!key) {
      throw new Error(
        "GUARDIAN_API_KEY is not set; the Guardian is not polled",
      );
    }
    const url = new URL(GUARDIAN_SEARCH_URL);
    url.searchParams.set("section", GUARDIAN_SECTIONS.join("|"));
    url.searchParams.set("order-by", "newest");
    url.searchParams.set("page-size", "50");
    url.searchParams.set("show-fields", "standfirst,trailText");

    const response = await fetch(url, {
      // The key travels in a header so it never lands in a logged URL.
      headers: { accept: "application/json", "api-key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Guardian API answered ${response.status}`);
    }
    return mapGuardianSearch(await response.json());
  },
};
