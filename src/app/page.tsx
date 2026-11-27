import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/page-shell";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { SeverityScale } from "@/features/landing/severity-scale";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import { getCurrentUser } from "@/lib/auth/session";

export default function LandingPage() {
  return (
    <>
      <SiteHeader signIn signUp />
      <Suspense fallback={null}>
        <RedirectWhenSignedIn />
      </Suspense>
      <PageContainer
        width="list"
        className="grid content-start items-center gap-12 pt-12 md:grid-cols-2 md:pt-18"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Hear about the earthquake, not the whole news cycle.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-prose text-base">
            Heads-up watches for events in the world. You choose the category
            and how severe an event has to be, and it emails you when one
            arrives.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Sign up
            </Link>
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Sign in
            </Link>
          </div>
        </div>
        <SeverityScale />
      </PageContainer>
    </>
  );
}

async function RedirectWhenSignedIn() {
  if (await getCurrentUser()) redirect(DEFAULT_SIGNED_IN_PATH);
  return null;
}
