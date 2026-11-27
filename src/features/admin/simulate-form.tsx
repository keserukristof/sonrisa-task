"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Field, FieldGroup, describedBy } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { initialActionResult, type ActionResult } from "@/lib/action-result";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  SEVERITIES,
  SEVERITY_LABELS,
  type Category,
  type Severity,
} from "@/lib/alerting/types";
import { simulateEvent } from "./actions";
import type { SimulateEventField } from "./schema";

type Values = {
  category: Category | null;
  severity: Severity;
  title: string;
  summary: string;
  url: string;
};

const DEFAULTS: Values = {
  category: null,
  severity: "high",
  title: "",
  summary: "",
  url: "",
};

export function SimulateForm() {
  const [state, action] = useActionState<
    ActionResult<SimulateEventField>,
    FormData
  >(simulateEvent, initialActionResult);
  const [values, setValues] = useState<Values>(DEFAULTS);
  const [seen, setSeen] = useState(state);

  // A new success resets the form to its defaults; a failure keeps what was typed.
  if (seen !== state) {
    setSeen(state);
    if (state.ok && state.message) setValues(DEFAULTS);
  }

  const errors = state.ok ? {} : (state.fieldErrors ?? {});
  const formRef = useRef<HTMLFormElement>(null);

  // Move focus to the first invalid field after a failed submit.
  useEffect(() => {
    if (state.ok || !state.fieldErrors) return;
    const invalid = formRef.current?.querySelector('[aria-invalid="true"]');
    if (invalid instanceof HTMLFieldSetElement) {
      invalid.querySelector("input")?.focus();
    } else if (invalid instanceof HTMLElement) {
      invalid.focus();
    }
  }, [state]);
  const isNews = values.category === "news";
  const severity = isNews ? "low" : values.severity;

  return (
    <div className="flex flex-col gap-6">
      {state.ok && state.message ? (
        <Notice variant="success">
          {state.message} The next tick, within a minute, matches and delivers
          it.{" "}
          <Link href="/notifications" className="underline underline-offset-4">
            See your notifications
          </Link>
        </Notice>
      ) : null}

      <form
        ref={formRef}
        action={action}
        noValidate
        className="bg-card flex flex-col gap-6 rounded-lg border p-4 sm:p-6"
      >
        <FieldGroup id="category" legend="Category" error={errors.category}>
          <div className="grid gap-2 sm:grid-cols-3">
            {CATEGORIES.map((category) => (
              <label
                key={category}
                className="has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-ring/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-focus-visible:ring-3"
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={values.category === category}
                  onChange={() => setValues({ ...values, category })}
                  className="accent-primary size-4"
                />
                {CATEGORY_LABELS[category]}
              </label>
            ))}
          </div>
        </FieldGroup>

        <Field
          id="severity"
          label="Severity"
          hint={isNews ? "News events are always low severity." : undefined}
        >
          <NativeSelect
            id="severity"
            name="severity"
            value={severity}
            disabled={isNews}
            onChange={(event) => {
              const next = SEVERITIES.find(
                (item) => item === event.target.value,
              );
              if (next) setValues({ ...values, severity: next });
            }}
            {...describedBy("severity", { hint: isNews })}
          >
            {SEVERITIES.map((item) => (
              <NativeSelectOption key={item} value={item}>
                {SEVERITY_LABELS[item]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field id="title" label="Title" error={errors.title}>
          <Input
            id="title"
            name="title"
            required
            value={values.title}
            onChange={(event) =>
              setValues({ ...values, title: event.target.value })
            }
            {...describedBy("title", { error: errors.title })}
          />
        </Field>

        <Field id="summary" label="Summary" optional error={errors.summary}>
          <Textarea
            id="summary"
            name="summary"
            className="h-20"
            value={values.summary}
            onChange={(event) =>
              setValues({ ...values, summary: event.target.value })
            }
            {...describedBy("summary", { error: errors.summary })}
          />
        </Field>

        <Field id="url" label="Link" optional error={errors.url}>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://example.com/report"
            value={values.url}
            onChange={(event) =>
              setValues({ ...values, url: event.target.value })
            }
            {...describedBy("url", { error: errors.url })}
          />
        </Field>

        {!state.ok && state.message ? (
          <Notice variant="error">{state.message}</Notice>
        ) : null}

        <SubmitButton
          pendingLabel="Creating…"
          className="w-full sm:w-auto sm:self-start"
        >
          Create simulated event
        </SubmitButton>
      </form>
    </div>
  );
}
