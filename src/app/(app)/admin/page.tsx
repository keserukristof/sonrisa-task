import { Suspense } from "react";
import {
  AdminFrame,
  AdminFrameFallback,
} from "@/features/admin/frame/admin-frame";
import {
  EmailBudgetSection,
  EmailBudgetSkeleton,
} from "@/features/admin/overview/email-budget-section";
import {
  SourceHealthSection,
  SourceHealthSkeleton,
} from "@/features/admin/overview/source-health-section";
import { requireAdmin } from "@/lib/auth/session";

/**
 * The admin overview: source health and today's email budget. Anyone but an
 * admin gets the not-found page, and nothing of it is in the static shell.
 */
export default function Page() {
  return (
    <Suspense fallback={<AdminFrameFallback />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  return (
    <AdminFrame current="overview">
      <div className="flex flex-col gap-8">
        <Suspense fallback={<SourceHealthSkeleton />}>
          <SourceHealthSection />
        </Suspense>
        <Suspense fallback={<EmailBudgetSkeleton />}>
          <EmailBudgetSection />
        </Suspense>
      </div>
    </AdminFrame>
  );
}
