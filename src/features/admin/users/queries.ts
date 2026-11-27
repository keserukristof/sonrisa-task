import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fetchPageOrFirst, PAGE_SIZE, type Page } from "../paging";
import { parseAdminUsers, toAdminUserRow, type AdminUserRowData } from "./rows";

export type AdminUserPage = Page<AdminUserRowData>;

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
  await requireAdmin();
  const { page, result } = await fetchPageOrFirst(requested, fetchPage);
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
