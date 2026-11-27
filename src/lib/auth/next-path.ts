import type { Route } from "next";

/** Where sign-in lands when no valid `next` was given. */
export const DEFAULT_SIGNED_IN_PATH: Route = "/alerts";

/**
 * The path to return to after sign-in. Accepts only a path on this site: it
 * must start with a single "/", so "//evil.example" and "https://…" fall back
 * to the default. This is what keeps `?next=` from being an open redirect.
 */
export function safeNextPath(next: unknown): Route {
  if (typeof next !== "string") return DEFAULT_SIGNED_IN_PATH;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return DEFAULT_SIGNED_IN_PATH;
  }
  // Control characters could split a header or hide a host.
  if (/[\u0000-\u001f\u007f]/.test(next)) return DEFAULT_SIGNED_IN_PATH;
  // Checked above to be a path on this site. Typed routes cannot know a
  // runtime path, so this is the one place it is asserted.
  return next as Route;
}
