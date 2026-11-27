"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, describedBy } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { initialActionResult, type ActionResult } from "@/lib/action-result";
import { signIn } from "./actions";
import type { SignInField } from "./schema";

export function SignInForm({ next }: { next: string | null }) {
  const [state, action] = useActionState<ActionResult<SignInField>, FormData>(
    signIn,
    initialActionResult,
  );
  const [email, setEmail] = useState("");
  const errors = state.ok ? {} : (state.fieldErrors ?? {});

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {!state.ok && state.code === "unconfirmed" ? (
        <Notice variant="error">
          Your email address isn&apos;t confirmed yet.{" "}
          <Link
            href="/sign-up/confirm"
            className="underline underline-offset-4"
          >
            See what to do
          </Link>
        </Notice>
      ) : null}
      {!state.ok && state.message ? (
        <Notice variant="error">{state.message}</Notice>
      ) : null}

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field id="email" label="Email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          {...describedBy("email", { error: errors.email })}
        />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          {...describedBy("password", { error: errors.password })}
        />
      </Field>
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
