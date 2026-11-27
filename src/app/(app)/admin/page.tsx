import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";

/**
 * The admin area has one page in increment 1. Anyone but an admin gets the
 * not-found page at this URL, so the area does not reveal itself.
 */
export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <Redirect />
    </Suspense>
  );
}

async function Redirect() {
  await requireAdmin();
  redirect("/admin/simulate");
  return null;
}
