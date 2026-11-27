"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

/** Re-renders the section that failed to load. */
export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      aria-disabled={pending}
      onClick={() => {
        if (!pending) startTransition(() => router.refresh());
      }}
    >
      Try again
    </Button>
  );
}
