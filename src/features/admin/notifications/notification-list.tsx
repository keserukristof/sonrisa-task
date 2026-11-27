import { NotificationStatus } from "@/components/notification-status";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminNotificationRowData } from "./rows";

// The same grid on the header row and every row; stacked below 640px.
const grid = "sm:grid sm:grid-cols-notification-row sm:gap-x-4";

function HeaderRow() {
  return (
    <div
      aria-hidden="true"
      className={`${grid} text-muted-foreground border-border hidden border-b px-4 py-2 text-sm font-medium`}
    >
      <span>Event</span>
      <span>Owner and destination</span>
      <span>Attempts</span>
      <span>Status</span>
    </div>
  );
}

/** The card: a header row (from 640px) and one row per notification. */
export function AdminNotificationList({
  rows,
}: {
  rows: AdminNotificationRowData[];
}) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <HeaderRow />
      <ul className="divide-border divide-y">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`${grid} flex flex-col gap-2 px-4 py-3 sm:items-start`}
          >
            <div className="min-w-0">
              <p className="font-semibold break-words">
                {row.title}{" "}
                {row.simulated ? (
                  <span className="max-sm:mt-1 max-sm:block">
                    <SimulatedBadge />
                  </span>
                ) : null}
              </p>
              <p className="text-muted-foreground text-sm">{row.eventTime}</p>
            </div>
            <div className="min-w-0 text-sm">
              <p className="break-words">
                <span className="sr-only">Owner </span>
                {row.ownerEmail}
              </p>
              <p className="text-muted-foreground">
                <span className="sr-only">Destination </span>
                {row.destination}
                <span className="sm:hidden" aria-hidden="true">
                  {" · "}
                  {row.attempts}
                </span>
              </p>
            </div>
            <p className="text-muted-foreground hidden text-sm sm:block">
              {row.attempts}
            </p>
            <NotificationStatus status={row.status} detail={row.detail} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Loading state: the card with three skeleton rows in the row's shape. */
export function AdminNotificationListSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading notifications"
      className="border-border bg-card overflow-hidden rounded-lg border"
    >
      <HeaderRow />
      <div className="divide-border divide-y" aria-hidden="true">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className={`${grid} flex flex-col gap-2 px-4 py-3 sm:items-start`}
          >
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3.5 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
