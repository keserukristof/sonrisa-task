import { Suspense } from "react";
import {
  AdminFrame,
  AdminFrameFallback,
} from "@/features/admin/frame/admin-frame";
import { requireAdmin } from "@/lib/auth/session";

/**
 * The admin overview: source health and today's email budget. Placeholder
 * from the Contracts ticket (#17); #24 builds it. Anyone but an admin gets
 * the not-found page, and nothing of it is in the static shell.
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
      <p className="text-muted-foreground">Not built yet.</p>
    </AdminFrame>
  );
}
