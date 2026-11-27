import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { SimulateForm } from "@/features/admin/simulate-form";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Simulate an event" };

export default function Page() {
  return (
    <PageContainer width="form">
      <PageHeader title="Simulate an event" className="mb-2" />
      <p className="text-muted-foreground mb-6">
        A simulated event is matched and delivered exactly like a real one. It
        is marked as simulated everywhere, including in the email.
      </p>
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireAdmin();
  return <SimulateForm />;
}
