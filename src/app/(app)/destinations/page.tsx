import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import {
  DestinationList,
  DestinationListSkeleton,
} from "@/features/destinations/destination-list";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Destinations" };

export default function Page() {
  return (
    <PageContainer width="list">
      <PageHeader title="Destinations" className="mb-2" />
      <p className="text-muted-foreground mb-6 text-sm">
        The places your alerts can send notifications to.
      </p>
      <Suspense fallback={<DestinationListSkeleton />}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireUser("/destinations");
  return <DestinationList />;
}
