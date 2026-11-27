import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  PAGE_SIZE,
  parseAdminUsers,
  toAdminUserRow,
  type AdminUserRowData,
} from "./rows";

export type AdminUserPage =
  | {
      ok: true;
      rows: AdminUserRowData[];
      /** The page shown, from 1. */
      page: number;
      hasNext: boolean;
    }
  | { ok: false };

async function fetchPage(page: number) {
  const supabase = await createClient();
  return supabase.rpc("admin_users", {
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
}

/** Every user, newest sign-up first. A page past the end shows the first. */
export async function getAdminUserPage(
  requested: number,
): Promise<AdminUserPage> {
  let page = requested;
  let result = await fetchPage(page);
  if (!result.error && result.data.length === 0 && page > 1) {
    page = 1;
    result = await fetchPage(page);
  }
  if (result.error) return { ok: false };

  const raw = parseAdminUsers(result.data);
  if (!raw) return { ok: false };

  const total = raw[0]?.total_count ?? 0;
  return {
    ok: true,
    rows: raw.map(toAdminUserRow),
    page,
    hasNext: (page - 1) * PAGE_SIZE + raw.length < total,
  };
}
