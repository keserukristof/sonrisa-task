import { Mail } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { Pager } from "@/components/pager";
import { buttonVariants } from "@/components/ui/button";
import { NotificationList } from "./notification-list";
import { parsePage } from "./notification-row";
import { getNotificationPage } from "./queries";

/** Request-time Server Component: render it inside `<Suspense>`. */
export async function NotificationsView({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { page: pageParam } = await searchParams;
  const requested = parsePage(pageParam);
  const result = await getNotificationPage(requested);

  if (!result.ok) {
    return (
      <Notice variant="error">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Couldn&apos;t load your notifications.</span>
          <Link
            href={{ pathname: "/notifications", query: { page: requested } }}
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
        <EmptyState
          icon={Mail}
          iconClassName="text-muted-foreground"
          title="No notifications yet"
          action={
            <Link
              href="/alerts"
              className={buttonVariants({ variant: "outline" })}
            >
              Go to alerts
            </Link>
          }
        >
          They appear here once one of your alerts matches an event.
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <NotificationList rows={result.rows} />
      <Pager
        pathname="/notifications"
        page={result.page}
        hasNext={result.hasNext}
      />
      <p className="text-muted-foreground mt-6 text-xs">
        Earthquake data: U.S. Geological Survey
      </p>
    </>
  );
}
