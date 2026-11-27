import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { SimulateForm } from "@/features/admin/simulate-form";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Nothing of this page, not even its title, is in the static shell: a
 * non-admin must not learn that it exists. So the title is set inside the
 * admin check rather than through `metadata`.
 */
export default function Page() {
  return (
    <Suspense fallback={<PageContainer width="form">{null}</PageContainer>}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  return (
    <PageContainer width="form">
      <title>Simulate an event · Heads-up</title>
      <PageHeader title="Simulate an event" className="mb-2" />
      <p className="text-muted-foreground mb-6">
        A simulated event is matched and delivered exactly like a real one. It
        is marked as simulated everywhere, including in the email.
      </p>
      <SimulateForm />
    </PageContainer>
  );
}
