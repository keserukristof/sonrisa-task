import { getHealth } from "./queries";

/** Request-time Server Component: render it inside `<Suspense>`. */
export async function SystemStatus() {
  const health = await getHealth();
  const isOk = health.status === "ok";

  return (
    <p role="status" className="flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${isOk ? "bg-emerald-600" : "bg-destructive"}`}
      />
      {isOk ? "Database connected" : "Database unavailable"}
    </p>
  );
}

export function SystemStatusFallback() {
  return (
    <p role="status" className="text-muted-foreground text-sm">
      Checking database…
    </p>
  );
}
