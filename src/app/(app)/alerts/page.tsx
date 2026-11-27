import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Placeholder } from "@/components/placeholder";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Alerts" };

export default function Page() {
  return (
    <PageContainer width="list">
      <PageHeader title="Alerts" />
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireUser("/alerts");
  return <Placeholder ticket={8} />;
}
