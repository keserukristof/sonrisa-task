import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import {
  AlertFormSection,
  AlertFormSkeleton,
  BackToAlerts,
} from "@/features/alerts/alert-form-section";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create alert" };

export default function Page() {
  return (
    <PageContainer width="form">
      <BackToAlerts />
      <PageHeader title="Create alert" className="mt-2" />
      <Suspense fallback={<AlertFormSkeleton />}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireUser("/alerts/new");
  return <AlertFormSection />;
}
