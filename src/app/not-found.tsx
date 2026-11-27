import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Shown for a path that does not exist and for one the visitor may not open.
 * The copy is the same for both, so it never reveals which it is.
 */
export default function NotFound() {
  return (
    <>
      <header className="border-border bg-card flex h-14 items-center border-b px-4 md:px-6">
        <Wordmark href="/" />
      </header>
      <PageContainer width="narrow" className="pt-12">
        <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="text-muted-foreground text-sm">
            This page doesn&apos;t exist, or you don&apos;t have access to it.
          </p>
          <div className="mt-2">
            <Link href="/alerts" className={buttonVariants({ size: "lg" })}>
              Go to alerts
            </Link>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
