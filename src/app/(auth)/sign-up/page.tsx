import type { Metadata } from "next";
import { PageContainer } from "@/components/page-shell";
import { Placeholder } from "@/components/placeholder";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return (
    <>
      <SiteHeader signIn />
      <PageContainer width="narrow" className="pt-12">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <Placeholder ticket={7} />
      </PageContainer>
    </>
  );
}
