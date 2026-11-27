"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
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
    <PageContainer width="narrow" className="pt-12 md:pt-12">
      <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm">
          The page couldn&apos;t be shown. Your alerts are not affected.
        </p>
        <div className="mt-2">
          <Button size="lg" onClick={() => retry()}>
            Try again
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
