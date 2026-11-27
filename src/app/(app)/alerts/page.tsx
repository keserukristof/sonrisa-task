import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/page-shell";
import {
  AlertsSection,
  AlertsSkeleton,
} from "@/features/alerts/alerts-section";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Alerts" };

export default function Page({ searchParams }: PageProps<"/alerts">) {
  return (
    <PageContainer width="list">
      <Suspense fallback={<AlertsSkeleton />}>
        <Content notice={searchParams.then((params) => params.notice)} />
      </Suspense>
    </PageContainer>
  );
}

async function Content({ notice }: { notice: Promise<unknown> }) {
  await requireUser("/alerts");
  return <AlertsSection notice={notice} />;
}
