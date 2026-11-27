type OriginOptions = {
  /** In production the configured URL is the only trusted origin. */
  production?: boolean;
  appUrl?: string;
};

/**
 * This site's own origin. In production it is the configured `APP_URL`, never
 * the request's headers, which a caller can spoof into the confirmation link.
 * Elsewhere it is built from the headers, so the link returns to the
 * per-worktree port the visitor signed up on. Returns null when the host is
 * missing or is not a plain host name.
 */
export function originFrom(
  headers: Headers,
  { production = false, appUrl }: OriginOptions = {},
): string | null {
  if (production) return appUrl ? new URL(appUrl).origin : null;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return null;
  const proto = headers.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host}`;
}
