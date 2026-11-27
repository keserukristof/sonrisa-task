import { NotificationStatus } from "@/components/notification-status";
import { SeverityMark } from "@/components/severity-mark";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationRowData } from "./notification-row";

// The same grid on the header row and every row; stacked below 640px.
const grid = "sm:grid sm:grid-cols-notification-row sm:gap-x-4";

/** The card: a header row (from 640px) and one row per notification. */
export function NotificationList({ rows }: { rows: NotificationRowData[] }) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div
        aria-hidden="true"
        className={`${grid} text-muted-foreground border-border hidden border-b px-4 py-2 text-sm font-medium`}
      >
        <span>Event</span>
        <span>Alert and destination</span>
        <span>Severity</span>
        <span>Status</span>
      </div>
      <ul className="divide-border divide-y">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`${grid} flex flex-col gap-2.5 px-4 py-3 sm:items-start`}
          >
            <div className="min-w-0 max-sm:order-0">
              <p className="font-semibold break-words">
                {row.title}{" "}
                {row.simulated ? (
                  <span className="max-sm:mt-1 max-sm:block">
                    <SimulatedBadge />
                  </span>
                ) : null}
              </p>
              <p className="text-muted-foreground text-sm">{row.eventTime}</p>
              {row.credit ? (
                <p className="text-muted-foreground text-xs">{row.credit}</p>
              ) : null}
            </div>
            <div className="max-sm:order-1 sm:order-2">
              {row.severity ? <SeverityMark severity={row.severity} /> : null}
            </div>
            <dl className="grid-cols-term grid min-w-0 gap-x-3 gap-y-0.5 text-sm max-sm:order-2 sm:order-1 sm:block">
              <dt className="text-muted-foreground sm:sr-only">Alert</dt>
              <dd className={row.alertName ? "" : "text-muted-foreground"}>
                {row.alertName ?? "Deleted alert"}
              </dd>
              <dt className="text-muted-foreground sm:sr-only">Destination</dt>
              <dd className="text-muted-foreground break-words">
                {row.destinationName}
              </dd>
            </dl>
            <NotificationStatus
              className="max-sm:order-3 sm:order-3"
              status={row.status}
              detail={row.detail}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Loading state: the card with three skeleton rows in the row's shape. */
export function NotificationListSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="border-border bg-card overflow-hidden rounded-lg border"
    >
      <div
        className={`${grid} text-muted-foreground border-border hidden border-b px-4 py-2 text-sm font-medium`}
      >
        <span>Event</span>
        <span>Alert and destination</span>
        <span>Severity</span>
        <span>Status</span>
      </div>
      <div className="divide-border divide-y">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className={`${grid} flex flex-col gap-2.5 px-4 py-3 sm:items-start`}
          >
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <Skeleton className="h-4 w-20" />
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
