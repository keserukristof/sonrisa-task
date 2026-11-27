import { Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { PageContainer } from "@/components/page-shell";
import { SiteHeader } from "@/components/site-header";
import { SIGN_UP_EMAIL_COOKIE } from "@/features/auth/sign-up-cookie";

export const metadata: Metadata = { title: "Check your inbox" };

export default function CheckInboxPage() {
  return (
    <>
      <SiteHeader signIn />
      <PageContainer width="narrow" className="pt-12 md:pt-12">
        <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-6">
          <Mail aria-hidden="true" className="text-primary size-6" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your inbox
          </h1>
          <p>
            We sent a link to{" "}
            <Suspense fallback="your email address">
              <Address />
            </Suspense>
            . Open it to confirm your account.
          </p>
          <p className="text-muted-foreground">
            If it isn&apos;t there in a few minutes, look in your spam folder.
          </p>
          <Link
            href="/sign-in"
            className="text-primary mt-2 text-sm underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </PageContainer>
    </>
  );
}

async function Address() {
  const email = (await cookies()).get(SIGN_UP_EMAIL_COOKIE)?.value;
  if (!email) return "your email address";
  return <strong className="font-semibold">{email}</strong>;
}
