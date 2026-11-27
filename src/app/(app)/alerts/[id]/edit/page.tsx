import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import {
  AlertFormSection,
  AlertFormSkeleton,
  BackToAlerts,
} from "@/features/alerts/alert-form-section";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit alert" };

export default function Page({ params }: PageProps<"/alerts/[id]/edit">) {
  return (
    <PageContainer width="form">
      <BackToAlerts />
      <PageHeader title="Edit alert" className="mt-2" />
      <Suspense fallback={<AlertFormSkeleton />}>
        <Content params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function Content({
  params,
}: Pick<PageProps<"/alerts/[id]/edit">, "params">) {
  const { id } = await params;
  await requireUser(`/alerts/${id}/edit`);
  return <AlertFormSection alertId={id} />;
}
