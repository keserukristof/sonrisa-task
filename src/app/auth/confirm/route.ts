import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { withNotice } from "@/lib/notices";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the confirmation email's link lands. Verifies the token, which signs
 * the visitor in, and always continues to /alerts: there is no `next`.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!tokenHash) redirect("/link-expired");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });
  if (error) redirect("/link-expired");

  redirect(withNotice("/alerts", "email-confirmed"));
}
