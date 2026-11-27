"use client";

import { useActionState, useState } from "react";
import { Field, describedBy } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { initialActionResult, type ActionResult } from "@/lib/action-result";
import { signUp } from "./actions";
import type { SignUpField } from "./schema";

export function SignUpForm() {
  const [state, action] = useActionState<ActionResult<SignUpField>, FormData>(
    signUp,
    initialActionResult,
  );
  const [email, setEmail] = useState("");
  const errors = state.ok ? {} : (state.fieldErrors ?? {});

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
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
          autoComplete="new-password"
          required
          {...describedBy("password", { error: errors.password })}
        />
      </Field>
      {!state.ok && state.message ? (
        <Notice variant="error">{state.message}</Notice>
      ) : null}
      <SubmitButton pendingLabel="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-muted-foreground text-sm">
        We email you a link to confirm this address before you can sign in.
      </p>
    </form>
  );
}
