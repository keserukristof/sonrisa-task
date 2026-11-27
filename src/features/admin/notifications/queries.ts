import "server-only";
import type { NotificationStatus } from "@/lib/alerting/types";
import { createClient } from "@/lib/supabase/server";
import {
  PAGE_SIZE,
  parseAdminNotifications,
  toAdminNotificationRow,
  type AdminNotificationRowData,
} from "./rows";

export type AdminNotificationPage =
  | {
      ok: true;
      rows: AdminNotificationRowData[];
      /** The page shown, from 1. */
      page: number;
      hasNext: boolean;
    }
  | { ok: false };

async function fetchPage(status: NotificationStatus | null, page: number) {
  const supabase = await createClient();
  return supabase.rpc("admin_notifications", {
    // Null means every status; the generated type does not know it can be null.
    p_status: status as string,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
}

/**
 * Every user's notifications, newest first, optionally of one status. The
 * database function returns nothing to a non-admin. A page past the end shows
 * the first page.
 */
export async function getAdminNotificationPage(
  status: NotificationStatus | null,
  requested: number,
): Promise<AdminNotificationPage> {
  let page = requested;
  let result = await fetchPage(status, page);
  if (!result.error && result.data.length === 0 && page > 1) {
    page = 1;
    result = await fetchPage(status, page);
  }
  if (result.error) return { ok: false };

  const raw = parseAdminNotifications(result.data);
  if (!raw) return { ok: false };

  const total = raw[0]?.total_count ?? 0;
  return {
    ok: true,
    rows: raw.map(toAdminNotificationRow),
    page,
    hasNext: (page - 1) * PAGE_SIZE + raw.length < total,
  };
}
