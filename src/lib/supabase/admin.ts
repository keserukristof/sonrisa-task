import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "./database.types";

/**
 * Supabase client with the secret key. It bypasses Row Level Security.
 *
 * Used by the alerting tick only (the tick route and the code it calls):
 * the tick acts for every user at once and has no session. Never import it
 * from a page, a Server Action or a query, and never use it to get around a
 * failing policy.
 */
export function createAdminClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type AdminClient = ReturnType<typeof createAdminClient>;
