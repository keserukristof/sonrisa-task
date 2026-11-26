import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { toHealthStatus, type HealthStatus } from "./health-status";

/** Probes the database. Uncached on purpose: a health check must reflect the present. */
export async function getHealth(): Promise<HealthStatus> {
  try {
    const { data, error } = await createPublicClient().rpc("health_check");
    return toHealthStatus(data, error?.message);
  } catch (error) {
    return toHealthStatus(
      null,
      error instanceof Error ? error.message : "Database is unreachable.",
    );
  }
}
