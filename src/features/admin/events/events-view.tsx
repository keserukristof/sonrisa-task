import { Newspaper } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { Pager } from "@/components/pager";
import { buttonVariants } from "@/components/ui/button";
import { EventList } from "./event-list";
import { parsePage } from "./event-row";
import { getEventPage } from "./queries";

/** Request-time Server Component: render it inside `<Suspense>`. */
export async function EventsView({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { page: pageParam } = await searchParams;
  const requested = parsePage(pageParam);
  const result = await getEventPage(requested);

  if (!result.ok) {
    return (
      <Notice variant="error">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Couldn&apos;t load the events.</span>
          <Link
            href={{ pathname: "/admin/events", query: { page: requested } }}
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
          icon={Newspaper}
          iconClassName="text-muted-foreground"
          title="No events yet"
          action={
            <Link
              href="/admin/simulate"
              className={buttonVariants({ variant: "outline" })}
            >
              Simulate an event
            </Link>
          }
        >
          Events appear here when a source is polled or an admin simulates one.
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <EventList rows={result.rows} />
      <Pager
        pathname="/admin/events"
        page={result.page}
        hasNext={result.hasNext}
      />
    </>
  );
}
