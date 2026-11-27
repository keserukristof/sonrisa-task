import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FlashNotice } from "@/components/flash-notice";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import {
  DestinationList,
  DestinationListSkeleton,
} from "@/features/destinations/destination-list";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Destinations" };

export default function Page({ searchParams }: PageProps<"/destinations">) {
  return (
    <PageContainer width="list">
      <PageHeader
        title="Destinations"
        className="mb-2"
        action={
          <Link
            href="/destinations/slack/new"
            className={buttonVariants({ size: "lg" })}
          >
            Add Slack destination
          </Link>
        }
      />
      <p className="text-muted-foreground mb-6 text-sm">
        The places your alerts can send notifications to.
      </p>
      <Suspense fallback={<DestinationListSkeleton />}>
        <Content notice={searchParams.then((params) => params.notice)} />
      </Suspense>
    </PageContainer>
  );
}

async function Content({ notice }: { notice: Promise<unknown> }) {
  await requireUser("/destinations");
  return (
    <>
      <FlashNotice notice={await notice} className="mb-6" />
      <DestinationList />
    </>
  );
}
