import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Supabase client bound to the current request's session cookies. Every query
 * runs as the signed-in user, so Row Level Security is the authorization boundary.
 *
 * Reads cookies, which makes the caller request-time: render it inside
 * `<Suspense>` and never call it from a `"use cache"` scope.
 * Create a new client per request; never share one across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Cookies are read-only while rendering a Server Component.
            // The proxy refreshes the session on every request, so this is safe to ignore.
          }
        },
      },
    },
  );
}
