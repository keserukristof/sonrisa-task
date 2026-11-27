import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fetchPageOrFirst, PAGE_SIZE, type Page } from "../paging";
import { parseRawEvents, toEventRow, type EventRowData } from "./event-row";

export type EventPage = Page<EventRowData>;

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
 * Every event, newest first. Admin only. A page past the end shows the first
 * page.
 */
export async function getEventPage(requested: number): Promise<EventPage> {
  await requireAdmin();
  const { page, result } = await fetchPageOrFirst(requested, fetchPage);
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
