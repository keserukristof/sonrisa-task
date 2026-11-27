import { Bell } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FlashNotice } from "@/components/flash-notice";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertsList } from "./alerts-list";
import { getAlerts, type AlertSummary } from "./queries";
import { RetryButton } from "./retry-button";

function CreateAlertLink() {
  return (
    <Link
      href="/alerts/new"
      className={buttonVariants({ variant: "default", size: "lg" })}
    >
      Create alert
    </Link>
  );
}

/** The page head and a skeleton list, shown while the alerts load. */
export function AlertsSkeleton() {
  return (
    <>
      <PageHeader title="Alerts" action={<CreateAlertLink />} />
      <div
        aria-busy="true"
        aria-label="Loading alerts"
        role="status"
        className="border-border bg-card divide-border divide-y rounded-lg border"
      >
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3.5 w-64 max-w-full" />
            </div>
            <Skeleton className="h-4 sm:w-42.5" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </div>
    </>
  );
}

export async function AlertsSection({ notice }: { notice: Promise<unknown> }) {
  const flash = await notice;
  let alerts: AlertSummary[];
  try {
    alerts = await getAlerts();
  } catch {
    return (
      <>
        <PageHeader title="Alerts" action={<CreateAlertLink />} />
        <Notice variant="error">
          <p className="font-semibold">Couldn&apos;t load your alerts.</p>
          <p>
            Your alerts are still saved and still running. Check your connection
            and try again.
          </p>
          <div className="mt-2">
            <RetryButton />
          </div>
        </Notice>
      </>
    );
  }

  const empty = alerts.length === 0;
  return (
    <>
      <PageHeader title="Alerts" action={empty ? null : <CreateAlertLink />} />
      <FlashNotice notice={flash} className="mb-6" />
      {empty ? (
        <div className="border-border bg-card rounded-lg border">
          <EmptyState
            icon={Bell}
            title="Create your first alert"
            action={<CreateAlertLink />}
          >
            An alert tells you when an event in a category you choose reaches a
            severity you choose. Your account email is ready as a destination.
          </EmptyState>
        </div>
      ) : (
        <AlertsList alerts={alerts} />
      )}
    </>
  );
}
