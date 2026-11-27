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
    // The Content API documents the key as the \`api-key\` query parameter; a
    // header form was not verified. The URL is never logged: errors carry
    // only the status.
    url.searchParams.set("api-key", key);

    const response = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Guardian API answered ${response.status}`);
    }
    return mapGuardianSearch(await response.json());
  },
};
