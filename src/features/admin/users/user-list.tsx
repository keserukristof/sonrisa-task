import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUserRowData } from "./rows";

// The same grid on the header row and every row; stacked below 640px.
const grid = "sm:grid sm:grid-cols-notification-row sm:gap-x-4";

function HeaderRow() {
  return (
    <div
      aria-hidden="true"
      className={`${grid} text-muted-foreground border-border hidden border-b px-4 py-2 text-sm font-medium`}
    >
      <span>Email</span>
      <span>Role</span>
      <span>Signed up</span>
      <span>Alerts</span>
    </div>
  );
}

/** The card: a header row (from 640px) and one row per user. */
export function UserList({ rows }: { rows: AdminUserRowData[] }) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <HeaderRow />
      <ul className="divide-border divide-y">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`${grid} flex flex-col gap-1.5 px-4 py-3 sm:items-center`}
          >
            <p className="min-w-0 font-semibold break-words">{row.email}</p>
            <div>
              <Badge variant={row.role === "Admin" ? "default" : "secondary"}>
                {row.role}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              <span className="sm:sr-only">Signed up </span>
              {row.signedUp}
            </p>
            <p className="text-muted-foreground text-sm">{row.alerts}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Loading state: the card with three skeleton rows in the row's shape. */
export function UserListSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading users"
      className="border-border bg-card overflow-hidden rounded-lg border"
    >
      <HeaderRow />
      <div className="divide-border divide-y" aria-hidden="true">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className={`${grid} flex flex-col gap-1.5 px-4 py-3 sm:items-center`}
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
