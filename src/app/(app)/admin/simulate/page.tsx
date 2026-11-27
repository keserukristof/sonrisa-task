import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Placeholder } from "@/components/placeholder";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Simulate an event" };

export default function Page() {
  return (
    <PageContainer width="form">
      <PageHeader title="Simulate an event" />
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireAdmin();
  return <Placeholder ticket={13} />;
}
