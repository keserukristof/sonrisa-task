import Link from "next/link";
import { PageContainer } from "@/components/page-shell";
import { Placeholder } from "@/components/placeholder";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <>
      <SiteHeader signIn signUp />
      <PageContainer width="list" className="pt-12">
        <h1 className="text-4xl font-bold tracking-tight">Heads-up</h1>
        <p className="text-muted-foreground mt-4 text-base">
          Heads-up emails you when an event in the world reaches the severity
          you chose.
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
        <div className="mt-6">
          <Placeholder ticket={7} />
        </div>
      </PageContainer>
    </>
  );
}
