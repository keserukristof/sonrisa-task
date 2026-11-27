import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageContainer } from "@/components/page-shell";
import { AddSlackForm } from "@/features/destinations/add-slack-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Add Slack destination" };

export default function Page() {
  return (
    <PageContainer width="form">
      <Link
        href="/destinations"
        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
      >
        Back to destinations
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-semibold tracking-tight">
        Add Slack destination
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Alerts can post to a Slack channel through an incoming webhook.
      </p>
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </PageContainer>
  );
}

async function Content() {
  await requireUser("/destinations/slack/new");
  return <AddSlackForm />;
}
