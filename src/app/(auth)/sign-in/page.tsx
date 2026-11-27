import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/page-shell";
import { SiteHeader } from "@/components/site-header";
import { SignInForm } from "@/features/auth/sign-in-form";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <>
      <SiteHeader signUp />
      <PageContainer width="narrow" className="pt-12">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Sign in</h1>
        <div className="border-border bg-card rounded-lg border p-6">
          <Suspense fallback={null}>
            <SignIn searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="mt-4 text-sm">
          New here?{" "}
          <Link
            href="/sign-up"
            className="text-primary underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </PageContainer>
    </>
  );
}

async function SignIn({
  searchParams,
}: Pick<PageProps<"/sign-in">, "searchParams">) {
  if (await getCurrentUser()) redirect(DEFAULT_SIGNED_IN_PATH);

  const { next } = await searchParams;
  return <SignInForm next={typeof next === "string" ? next : null} />;
}
