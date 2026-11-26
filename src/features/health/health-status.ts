export type HealthStatus =
  | { status: "ok"; databaseTime: string }
  | { status: "degraded"; reason: string };

/**
 * Maps the raw probe result to the public health contract. Kept pure so the
 * contract is unit-tested without a database.
 */
export function toHealthStatus(
  databaseTime: string | null,
  errorMessage?: string,
): HealthStatus {
  if (errorMessage) {
    return { status: "degraded", reason: errorMessage };
  }
  if (!databaseTime) {
    return { status: "degraded", reason: "Database returned no timestamp." };
  }
  return { status: "ok", databaseTime };
}
