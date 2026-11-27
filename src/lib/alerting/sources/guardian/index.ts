import type { Source } from "@/lib/alerting/types";
import { sourceEntry } from "../catalog";

/**
 * Placeholder from the Contracts ticket (#17), registered with the tick so
 * no other ticket edits collaborators.ts. #21 replaces `fetch` with the real
 * request and a pure mapper tested on recorded responses. The id, category
 * and interval come from the catalog and stay.
 */
export const guardianSource: Source = {
  id: "guardian",
  category: "news",
  intervalSeconds: sourceEntry("guardian")?.intervalSeconds ?? 180,
  async fetch() {
    return [];
  },
};
