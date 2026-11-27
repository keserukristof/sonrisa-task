import { Notice } from "@/components/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { serverEnv } from "@/lib/env.server";
import { getSourcePolls } from "./queries";
import { RetryButton } from "./retry-button";
import { buildSourceRows, type PollRecord } from "./source-rows";
import { SourceStatus } from "./source-status";

const COLUMNS = "sm:grid-cols-6";
const SOURCE_SPAN = "sm:col-span-2";
const POLL_SPAN = "sm:col-span-2";

function Heading() {
  return <h2 className="mb-3 text-lg font-semibold">Sources</h2>;
}

export function SourceHealthSkeleton() {
  return (
    <section>
      <Heading />
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading the source health"
        className="border-border bg-card divide-border divide-y rounded-lg border"
      >
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-52 max-w-full" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Request-time Server Component: render it inside `<Suspense>`. */
export async function SourceHealthSection() {
  if (!serverEnv().REAL_POLLING) {
    return (
      <section>
        <Heading />
        <div className="border-border bg-card rounded-lg border px-4 py-4">
          <p className="font-semibold">Not polled in this environment</p>
          <p className="text-muted-foreground text-sm">
            Real polling is switched on only in production. Here, events come
            from simulation and recorded responses.
          </p>
        </div>
      </section>
    );
  }

  let polls: PollRecord[];
  try {
    polls = await getSourcePolls();
  } catch {
    return (
      <section>
        <Heading />
        <Notice variant="error">
          <p className="font-semibold">Couldn&apos;t load the source health.</p>
          <div className="mt-2">
            <RetryButton />
          </div>
        </Notice>
      </section>
    );
  }

  const rows = buildSourceRows(polls, new Date());
  return (
    <section>
      <Heading />
      <div className="border-border bg-card rounded-lg border">
        <div
          aria-hidden="true"
          className={`text-muted-foreground border-border hidden gap-4 border-b px-4 py-2 text-sm sm:grid ${COLUMNS}`}
        >
          <span className={SOURCE_SPAN}>Source</span>
          <span className={POLL_SPAN}>Last poll</span>
          <span>Events stored</span>
          <span>Status</span>
        </div>
        <ul className="divide-border divide-y">
          {rows.map((row) => (
            <li
              key={row.id}
              className={`grid gap-1 px-4 py-3 sm:items-start sm:gap-4 ${COLUMNS}`}
            >
              <div
                className={`flex items-start justify-between gap-3 sm:block ${SOURCE_SPAN}`}
              >
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {row.description}
                  </p>
                </div>
                <div className="sm:hidden">
                  <SourceStatus status={row.status} />
                </div>
              </div>
              <div className={`text-sm ${POLL_SPAN}`}>
                {row.lastPoll === null ? (
                  <p>Never polled</p>
                ) : (
                  <>
                    <p>
                      <span className="sm:hidden">Last poll </span>
                      {row.lastPoll}
                    </p>
                    <p className="text-muted-foreground">{row.outcome}</p>
                  </>
                )}
              </div>
              <p className="text-sm">
                {row.eventsStored === null ? (
                  "—"
                ) : (
                  <>
                    {row.eventsStored}
                    <span className="sm:hidden">
                      {row.eventsStored === 1 ? " event" : " events"} stored
                    </span>
                  </>
                )}
              </p>
              <div className="hidden sm:block">
                <SourceStatus status={row.status} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
