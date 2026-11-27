/**
 * This site's own origin, built from the request's headers, so the
 * confirmation link returns to the port or domain the visitor signed up on.
 * Returns null when the host is missing or is not a plain host name.
 */
export function originFrom(headers: Headers): string | null {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return null;
  const proto = headers.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host}`;
}
