import Link from "next/link";
import { PageContainer } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";

/**
 * The body of the not-found page: the same copy for a path that does not
 * exist and one the visitor may not open, so it never reveals which. The
 * caller supplies the header (or relies on the layout's).
 */
export function NotFoundCard() {
  return (
    <PageContainer width="narrow" className="pt-12 md:pt-12">
      {/* Metadata is not applied once the page has started streaming. */}
      <title>Page not found · Heads-up</title>
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
  );
}
