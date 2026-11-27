import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/page-shell";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "This link has expired or was already used",
};

export default function LinkExpiredPage() {
  return (
    <>
      <SiteHeader signIn />
      <PageContainer width="narrow" className="pt-12 md:pt-12">
        <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            This link has expired or was already used
          </h1>
          <p className="text-muted-foreground">
            If you already confirmed your address, sign in.
          </p>
          <Link
            href="/sign-in"
            className={buttonVariants({ size: "lg", className: "mt-2" })}
          >
            Go to sign in
          </Link>
        </div>
      </PageContainer>
    </>
  );
}
