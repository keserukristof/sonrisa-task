import "server-only";
import { notFound, redirect } from "next/navigation";
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

/**
 * For every page that needs an account: returns the user, or sends a
 * signed-out visitor to sign in and back to `nextPath` afterwards.
 * Request-time: call it inside `<Suspense>`.
 *
 * Server Actions do not use this. An action gets the user with
 * `getCurrentUser()` and returns an error result when there is none.
 */
export async function requireUser(nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/** Whether the signed-in user is an admin. False for anonymous visitors. */
export const isCurrentUserAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error("Could not read the current user's role.");
  return data?.role === "admin";
});

/**
 * For every admin page: returns the admin, or shows the not-found page to
 * anyone else, signed in or not, so the admin area does not reveal itself.
 * Request-time: call it inside `<Suspense>`.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !(await isCurrentUserAdmin())) {
    notFound();
  }
  return user;
}
