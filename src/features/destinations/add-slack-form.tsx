"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Field, describedBy } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { useFocusFirstInvalid } from "@/components/use-focus-first-invalid";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialActionResult, type ActionResult } from "@/lib/action-result";
import { cn } from "cn";
import { addSlackDestination } from "./actions";
import type { AddSlackField } from "./add-failure";

export function AddSlackForm() {
  const [state, action] = useActionState<ActionResult<AddSlackField>, FormData>(
    addSlackDestination,
    initialActionResult,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const errors = state.ok ? {} : (state.fieldErrors ?? {});
  const formMessage = !state.ok ? state.message : undefined;

  useFocusFirstInvalid(formRef, state);

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="border-border bg-card flex flex-col gap-6 rounded-lg border p-4 md:p-6"
    >
      <Field
        id="name"
        label="Name"
        hint="Shown on your destinations and alerts. Up to 60 characters."
        error={errors.name}
      >
        <Input
          id="name"
          name="name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          {...describedBy("name", { hint: true, error: errors.name })}
        />
      </Field>

      <Field
        id="url"
        label="Webhook URL"
        hint="Create an incoming webhook for the channel in Slack, then paste its URL. Heads-up never shows it again: you see only its last 4 characters."
        error={errors.url}
      >
        <Input
          id="url"
          name="url"
          type="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://hooks.slack.com/services/…"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          {...describedBy("url", { hint: true, error: errors.url })}
        />
      </Field>

      {formMessage ? (
        <FocusedNotice message={formMessage} result={state} />
      ) : null}

      <div className="flex gap-2">
        <SubmitButton pendingLabel="Adding…">Add destination</SubmitButton>
        <Link
          href="/destinations"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** The form-level error; it takes focus each time a new result brings it. */
function FocusedNotice({
  message,
  result,
}: {
  message: string;
  result: ActionResult<AddSlackField>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [result]);
  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      <Notice variant="error">{message}</Notice>
    </div>
  );
}
