import { Suspense } from "react";
import { SimulateForm } from "@/features/admin/simulate-form";
import {
  AdminFrame,
  AdminFrameFallback,
} from "@/features/admin/frame/admin-frame";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Nothing of this page, not even its title, is in the static shell: a
 * non-admin must not learn that it exists. AdminFrame sets the title inside
 * the admin check. Design: docs/design/screens/admin-simulate.md.
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
    <AdminFrame current="simulate">
      <div className="max-w-xl">
        <h2 className="mb-2 text-lg font-semibold">Simulate an event</h2>
        <p className="text-muted-foreground mb-6">
          A simulated event is matched and delivered exactly like a real one. It
          is marked as simulated everywhere, including in the email.
        </p>
        <SimulateForm />
      </div>
    </AdminFrame>
  );
}
