"use server";

import { redirect } from "next/navigation";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { safeNextPath } from "@/lib/auth/next-path";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, type SignInField } from "./schema";

export async function signIn(
  _previous: ActionResult<SignInField>,
  formData: FormData,
): Promise<ActionResult<SignInField>> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<SignInField>(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, code: "unconfirmed" };
    }
    // Never say which of the two was wrong.
    return { ok: false, message: "Email or password is incorrect." };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
