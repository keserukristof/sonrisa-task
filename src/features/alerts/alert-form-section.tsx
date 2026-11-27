import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice } from "@/components/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { AlertForm } from "./alert-form";
import { getAlert, getDestinationOptions, type AlertDetail } from "./queries";
import { RetryButton } from "./retry-button";

export function AlertFormSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading alert"
      role="status"
      className="border-border bg-card flex flex-col gap-6 rounded-lg border p-4 md:p-6"
    >
      <Skeleton className="h-9" />
      <Skeleton className="h-16" />
      <Skeleton className="h-9" />
      <Skeleton className="h-9" />
      <Skeleton className="h-16" />
    </div>
  );
}

export function BackToAlerts() {
  return (
    <Link
      href="/alerts"
      className={buttonVariants({ variant: "link", size: "sm" })}
    >
      Back to alerts
    </Link>
  );
}

/** The form card for `/alerts/new` (no id) and `/alerts/<id>/edit`. */
export async function AlertFormSection({ alertId }: { alertId?: string }) {
  let alert: AlertDetail | null = null;
  let loaded;
  try {
    if (alertId !== undefined) alert = await getAlert(alertId);
    loaded = await getDestinationOptions();
  } catch {
    return (
      <Notice variant="error">
        <p className="font-semibold">Couldn&apos;t load this alert.</p>
        <div className="mt-2">
          <RetryButton />
        </div>
      </Notice>
    );
  }
  if (alertId !== undefined && alert === null) notFound();

  return (
    <AlertForm
      destinations={loaded.destinations}
      accountEmail={loaded.accountEmail}
      alert={alert ?? undefined}
    />
  );
}
