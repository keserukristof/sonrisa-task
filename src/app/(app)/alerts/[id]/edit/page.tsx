import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Placeholder } from "@/components/placeholder";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit alert" };

export default function Page({ params }: PageProps<"/alerts/[id]/edit">) {
  return (
    <PageContainer width="form">
      <PageHeader title="Edit alert" />
      <Suspense fallback={null}>
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
  return <Placeholder ticket={8} />;
}
