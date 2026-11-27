"use client";

import { useEffect } from "react";
import { Notice } from "@/components/notice";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

export default function DestinationsError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer width="list">
      <PageHeader title="Destinations" className="mb-2" />
      <p className="text-muted-foreground mb-6 text-sm">
        The places your alerts can send notifications to.
      </p>
      <Notice variant="error">
        <p>Couldn&apos;t load your destinations.</p>
        <Button variant="outline" className="mt-2" onClick={() => retry()}>
          Try again
        </Button>
      </Notice>
    </PageContainer>
  );
}
