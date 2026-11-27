import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  PAGE_SIZE,
  parseRawEvents,
  toEventRow,
  type EventRowData,
} from "./event-row";

export type EventPage =
  | {
      ok: true;
      rows: EventRowData[];
      /** The page shown, from 1. */
      page: number;
      hasNext: boolean;
    }
  | { ok: false };

const COLUMNS = "id, source, category, severity, title, occurred_at, simulated";

async function fetchPage(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  return supabase
    .from("events")
    .select(COLUMNS, { count: "exact" })
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
}

/**
 * Every event, newest first. Only the admin page calls it, after
 * `requireAdmin()`. A page past the end shows the first page.
 */
export async function getEventPage(requested: number): Promise<EventPage> {
  let page = requested;
  let result = await fetchPage(page);
  if (!result.error && result.data.length === 0 && page > 1) {
    page = 1;
    result = await fetchPage(page);
  }
  if (result.error) return { ok: false };

  const raw = parseRawEvents(result.data);
  if (!raw || result.count === null) return { ok: false };

  return {
    ok: true,
    rows: raw.map(toEventRow),
    page,
    hasNext: result.count > page * PAGE_SIZE,
  };
}
