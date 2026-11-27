"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { safeNextPath } from "@/lib/auth/next-path";
import { serverEnv } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";
import { originFrom } from "./origin";
import { SIGN_UP_EMAIL_COOKIE } from "./sign-up-cookie";
import {
  signInSchema,
  signUpSchema,
  type SignInField,
  type SignUpField,
} from "./schema";

export async function signUp(
  _previous: ActionResult<SignUpField>,
  formData: FormData,
): Promise<ActionResult<SignUpField>> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<SignUpField>(parsed.error),
    };
  }

  const origin = originFrom(await headers(), {
    production: process.env.NODE_ENV === "production",
    appUrl: serverEnv().APP_URL,
  });
  if (!origin) {
    return { ok: false, message: "Couldn't create your account. Try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  // An existing address is not an error to the visitor: they get the same
  // page, so the response never reveals whether an account exists.
  if (error && error.code !== "user_already_exists") {
    return { ok: false, message: "Couldn't create your account. Try again." };
  }

  // An address that already has an account gets the same page.
  (await cookies()).set(SIGN_UP_EMAIL_COOKIE, parsed.data.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/sign-up",
    maxAge: 60 * 60,
  });
  redirect("/sign-up/confirm");
}

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
