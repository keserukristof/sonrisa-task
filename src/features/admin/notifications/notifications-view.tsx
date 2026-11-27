import { Mail } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FilterLinks } from "@/components/filter-links";
import { Notice } from "@/components/notice";
import { buttonVariants } from "@/components/ui/button";
import { NOTIFICATION_STATUSES } from "@/lib/alerting/types";
import { parsePage } from "../users/rows";
import { AdminNotificationList } from "./notification-list";
import { getAdminNotificationPage } from "./queries";
import { parseStatusFilter, statusHref } from "./rows";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const FILTERS = [
  { label: "All", status: null },
  ...NOTIFICATION_STATUSES.map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    status,
  })),
];

const NOTHING_SENTENCE = {
  pending: "Nothing is waiting to be sent.",
  sent: "Nothing has been sent yet.",
  failed: "Nothing has failed.",
  skipped: "Nothing has been skipped.",
} as const;

function toRoute(href: string): Route {
  // Only our own constant path and an encoded query reach here.
  return href as Route;
}

/** Previous and Next that keep `?status=`, which the shared Pager would drop. */
function FilteredPager({
  status,
  page,
  hasNext,
}: {
  status: ReturnType<typeof parseStatusFilter>;
  page: number;
  hasNext: boolean;
}) {
  if (page === 1 && !hasNext) return null;
  const link = buttonVariants({ variant: "outline", size: "sm" });
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 pt-4"
    >
      <span className="text-muted-foreground text-sm">Page {page}</span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={toRoute(statusHref(status, page - 1))} className={link}>
            Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={toRoute(statusHref(status, page + 1))} className={link}>
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

/** The status filter alone: it renders before the list loads. */
export function StatusFilter({ searchParams }: { searchParams: SearchParams }) {
  return <FilterFromParams searchParams={searchParams} />;
}

async function FilterFromParams({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status: statusParam } = await searchParams;
  const current = parseStatusFilter(statusParam);
  return (
    <FilterLinks
      label="Status"
      options={FILTERS.map((f) => ({
        label: f.label,
        href: toRoute(statusHref(f.status)),
        current: f.status === current,
      }))}
    />
  );
}

/** Request-time Server Component: render it inside `<Suspense>`. */
export async function AdminNotificationsView({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = parseStatusFilter(statusParam);
  const requested = parsePage(pageParam);
  const result = await getAdminNotificationPage(status, requested);

  if (!result.ok) {
    return (
      <Notice variant="error">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Couldn&apos;t load the notifications.</span>
          <Link
            href={toRoute(statusHref(status, requested))}
            className={buttonVariants({ variant: "outline" })}
          >
            Try again
          </Link>
        </div>
      </Notice>
    );
  }

  if (result.rows.length === 0) {
    return (
      <div className="border-border bg-card rounded-lg border">
        {status ? (
          <EmptyState
            icon={Mail}
            iconClassName="text-muted-foreground"
            title={`No ${status} notifications`}
            action={
              <Link
                href={toRoute(statusHref(null))}
                className={buttonVariants({ variant: "outline" })}
              >
                Show all
              </Link>
            }
          >
            {NOTHING_SENTENCE[status]} Choose All to see every notification.
          </EmptyState>
        ) : (
          <EmptyState
            icon={Mail}
            iconClassName="text-muted-foreground"
            title="No notifications yet"
          >
            They appear here once an alert matches an event.
          </EmptyState>
        )}
      </div>
    );
  }

  return (
    <>
      <AdminNotificationList rows={result.rows} />
      <FilteredPager
        status={status}
        page={result.page}
        hasNext={result.hasNext}
      />
    </>
  );
}
