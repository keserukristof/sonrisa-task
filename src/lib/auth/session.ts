import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Minimal user DTO. Never pass the raw Supabase user or claims to the client. */
export type CurrentUser = {
  id: string;
  email: string | null;
};

/**
 * Data access layer entry point for identity. Verifies the session JWT on the
 * server and returns a narrow DTO, or `null` for anonymous visitors.
 *
 * Memoized per request with React `cache`, so pages and components can call it
 * freely. Request-time: render callers inside `<Suspense>`.
 *
 * The proxy only refreshes sessions; this is the actual authentication check.
 * When the app gains a sign-in route, add `requireUser()` here that redirects
 * anonymous visitors to it, and call it at the top of every protected page,
 * Server Action and Route Handler.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    return null;
  }

  const { sub, email } = data.claims;
  return { id: sub, email: typeof email === "string" ? email : null };
});
