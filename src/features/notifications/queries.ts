import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  PAGE_SIZE,
  parseRawNotifications,
  toNotificationRow,
  type NotificationRowData,
} from "./notification-row";

export type NotificationPage =
  | {
      ok: true;
      rows: NotificationRowData[];
      /** The page shown, from 1. */
      page: number;
      hasNext: boolean;
    }
  | { ok: false };

const COLUMNS =
  "id, status, attempts, next_attempt_at, last_error, skip_reason, sent_at, events(title, severity, occurred_at, simulated), alerts(name), destinations(name)";

async function fetchPage(userId: string, page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  // One extra row tells whether there is a next page.
  return supabase
    .from("notifications")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE);
}

/**
 * The signed-in user's notifications, newest first. Filtered by user: Row
 * Level Security lets admins read every row. A page past the end shows the
 * first page.
 */
export async function getNotificationPage(
  requested: number,
): Promise<NotificationPage> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  let page = requested;
  let result = await fetchPage(user.id, page);
  if (!result.error && result.data.length === 0 && page > 1) {
    page = 1;
    result = await fetchPage(user.id, page);
  }
  if (result.error) return { ok: false };

  const raw = parseRawNotifications(result.data);
  if (!raw) return { ok: false };

  const rows = raw.slice(0, PAGE_SIZE).map(toNotificationRow);
  return { ok: true, rows, page, hasNext: raw.length > PAGE_SIZE };
}
