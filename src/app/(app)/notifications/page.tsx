import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Placeholder } from "@/components/placeholder";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <PageContainer width="list">
      <PageHeader title="Notifications" />
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireUser("/notifications");
  return <Placeholder ticket={12} />;
}
