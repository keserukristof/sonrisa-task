import { SeverityMark } from "@/components/severity-mark";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventRowData } from "./event-row";

// The same grid on the header row and every row; stacked below 640px.
// Four equal tracks: the title spans two, source and severity one each.
const grid = "sm:grid sm:grid-cols-4 sm:gap-x-4";

const headerClass = `${grid} text-muted-foreground border-border hidden border-b px-4 py-2 text-sm font-medium`;

/** The card: a header row (from 640px) and one row per event. */
export function EventList({ rows }: { rows: EventRowData[] }) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div aria-hidden="true" className={headerClass}>
        <span className="sm:col-span-2">Event</span>
        <span>Source and category</span>
        <span>Severity</span>
      </div>
      <ul className="divide-border divide-y">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`${grid} flex flex-col gap-2.5 px-4 py-3 sm:items-start`}
          >
            <div className="min-w-0 sm:col-span-2">
              <p className="font-semibold break-words">
                {row.title}{" "}
                {row.simulated ? (
                  <span className="max-sm:mt-1 max-sm:block">
                    <SimulatedBadge />
                  </span>
                ) : null}
              </p>
              <p className="text-muted-foreground text-sm">{row.time}</p>
            </div>
            <div className="min-w-0 text-sm">
              <p>{row.sourceName}</p>
              <p className="text-muted-foreground">{row.categoryLabel}</p>
              {row.credit ? (
                <p className="text-muted-foreground text-xs">{row.credit}</p>
              ) : null}
            </div>
            <SeverityMark severity={row.severity} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Loading state: the card with three skeleton rows in the row's shape. */
export function EventListSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading events"
      className="border-border bg-card overflow-hidden rounded-lg border"
    >
      <div aria-hidden="true" className={headerClass}>
        <span className="sm:col-span-2">Event</span>
        <span>Source and category</span>
        <span>Severity</span>
      </div>
      <div aria-hidden="true" className="divide-border divide-y">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className={`${grid} flex flex-col gap-2.5 px-4 py-3 sm:items-start`}
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
