import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Placeholder } from "@/components/placeholder";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Destinations" };

export default function Page() {
  return (
    <PageContainer width="list">
      <PageHeader title="Destinations" />
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireUser("/destinations");
  return <Placeholder ticket={11} />;
}
