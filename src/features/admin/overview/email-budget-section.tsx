import { Meter } from "@/components/meter";
import { Notice } from "@/components/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_TICK_CONFIG } from "@/lib/alerting/config";
import { getEmailBudget, type EmailBudget } from "./queries";
import { RetryButton } from "./retry-button";

const DAILY_EMAILS = DEFAULT_TICK_CONFIG.emailsPerSystemPerDay;
const DAILY_TEST_SENDS = 20;

function Heading() {
  return <h2 className="mb-3 text-lg font-semibold">Email budget</h2>;
}

export function EmailBudgetSkeleton() {
  return (
    <section>
      <Heading />
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading the email budget"
        className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4"
      >
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </section>
  );
}

/** Request-time Server Component: render it inside `<Suspense>`. */
export async function EmailBudgetSection() {
  let budget: EmailBudget;
  try {
    budget = await getEmailBudget();
  } catch {
    return (
      <section>
        <Heading />
        <Notice variant="error">
          <p className="font-semibold">Couldn&apos;t load the email budget.</p>
          <div className="mt-2">
            <RetryButton />
          </div>
        </Notice>
      </section>
    );
  }

  return (
    <section>
      <Heading />
      <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
        <p>
          <strong className="font-bold">
            {budget.emailsToday} of {DAILY_EMAILS}
          </strong>{" "}
          emails sent today (UTC)
        </p>
        <Meter
          value={budget.emailsToday}
          max={DAILY_EMAILS}
          label={`${budget.emailsToday} of ${DAILY_EMAILS} emails sent today`}
        />
        <p className="text-muted-foreground text-sm">
          {budget.testSendsToday} of {DAILY_TEST_SENDS} test sends
        </p>
        <p className="text-muted-foreground text-sm">
          Resets at 00:00 UTC. Over the budget, emails are skipped with the
          reason &quot;Daily system limit ({DAILY_EMAILS}) reached&quot;.
        </p>
      </div>
    </section>
  );
}
