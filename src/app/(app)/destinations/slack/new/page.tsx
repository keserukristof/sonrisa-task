import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Add Slack destination" };

/**
 * Placeholder from the Contracts ticket (#17); #19 builds the form.
 * Design: docs/design/screens/add-slack-destination.md.
 */
export default function Page() {
  return (
    <PageContainer width="form">
      <PageHeader title="Add Slack destination" />
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireUser("/destinations/slack/new");
  return <p className="text-muted-foreground">Not built yet.</p>;
}
