import { Suspense } from "react";
import {
  AdminFrame,
  AdminFrameFallback,
} from "@/features/admin/frame/admin-frame";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Placeholder from the Contracts ticket (#17); #26 builds it.
 * Nothing of it is in the static shell: see AdminFrame.
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
    <AdminFrame current="events">
      <p className="text-muted-foreground">Not built yet.</p>
    </AdminFrame>
  );
}
