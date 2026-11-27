import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/page-shell";
import { SiteHeader } from "@/components/site-header";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <>
      <SiteHeader signIn />
      <PageContainer width="narrow" className="pt-12">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <div className="border-border bg-card rounded-lg border p-6">
          <Suspense fallback={null}>
            <SignUp />
          </Suspense>
        </div>
        <p className="mt-4 text-sm">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-primary underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </PageContainer>
    </>
  );
}

async function SignUp() {
  if (await getCurrentUser()) redirect(DEFAULT_SIGNED_IN_PATH);
  return <SignUpForm />;
}
