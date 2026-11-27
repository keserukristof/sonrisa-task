"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { BrokenMark } from "@/components/broken-mark";
import { Field, FieldGroup, describedBy } from "@/components/form-field";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { initialActionResult, type ActionResult } from "@/lib/action-result";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  MIN_SEVERITY_LABELS,
  SEVERITIES,
  type Category,
  type Severity,
} from "@/lib/alerting/types";
import { fieldErrorsFrom } from "@/lib/action-result";
import { cn } from "cn";
import { saveAlert } from "./actions";
import { parseAlertForm } from "./form-data";
import type { AlertDetail, DestinationOption } from "./queries";
import type { AlertField } from "./schema";

type Errors = Partial<Record<AlertField, string>>;

function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((category) => category === value);
}

export function AlertForm({
  destinations,
  accountEmail,
  alert,
}: {
  destinations: DestinationOption[];
  accountEmail: string | null;
  alert?: AlertDetail;
}) {
  const editing = alert !== undefined;
  const [state, action] = useActionState<ActionResult<AlertField>, FormData>(
    saveAlert,
    initialActionResult,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState(alert?.name ?? "");
  const [category, setCategory] = useState<Category | "">(
    alert?.category ?? "",
  );
  const [severity, setSeverity] = useState<Severity>(
    alert?.minSeverity ?? "moderate",
  );
  const [keywords, setKeywords] = useState(alert?.keywords.join(", ") ?? "");
  const [selected, setSelected] = useState<string[]>(
    alert?.destinationIds ??
      destinations.filter((d) => d.channelType === "email").map((d) => d.id),
  );
  const [clientErrors, setClientErrors] = useState<Errors>({});
  const [focusKey, setFocusKey] = useState(0);

  const serverErrors: Errors = state.ok ? {} : (state.fieldErrors ?? {});
  const errors: Errors = { ...serverErrors, ...clientErrors };
  const isNews = category === "news";

  // Move focus to the first invalid field after a failed submit.
  const serverErrorKey = JSON.stringify(serverErrors);
  useEffect(() => {
    if (focusKey === 0 && serverErrorKey === "{}") return;
    const invalid = formRef.current?.querySelector('[aria-invalid="true"]');
    if (!invalid) return;
    const target =
      invalid.tagName === "FIELDSET"
        ? invalid.querySelector<HTMLElement>('[role="radio"],[role="checkbox"]')
        : invalid;
    if (target instanceof HTMLElement) target.focus();
  }, [focusKey, serverErrorKey]);

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const result = parseAlertForm(new FormData(event.currentTarget));
    if (result.success) {
      setClientErrors({});
      return;
    }
    event.preventDefault();
    setClientErrors(fieldErrorsFrom<AlertField>(result.error));
    setFocusKey((key) => key + 1);
  }

  function toggleDestination(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={validate}
      noValidate
      className="border-border bg-card flex flex-col gap-6 rounded-lg border p-4 md:p-6"
    >
      {alert ? <input type="hidden" name="alertId" value={alert.id} /> : null}

      <Field id="name" label="Name" error={errors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          {...describedBy("name", { error: errors.name })}
        />
      </Field>

      <FieldGroup id="category" legend="Category" error={errors.category}>
        <input type="hidden" name="category" value={category} />
        <RadioGroup
          value={category}
          onValueChange={(value) => {
            if (isCategory(value)) setCategory(value);
          }}
          className="grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {CATEGORIES.map((value) => (
            <label
              key={value}
              className={cn(
                "border-input flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm",
                category === value && "border-primary",
                errors.category && "border-destructive",
              )}
            >
              <RadioGroupItem value={value} />
              {CATEGORY_LABELS[value]}
            </label>
          ))}
        </RadioGroup>
      </FieldGroup>

      <Field
        id="minSeverity"
        label="Minimum severity"
        hint={
          isNews
            ? "News has no severity levels; every article matches. Use keywords to narrow it."
            : "You hear about events at this level or higher."
        }
        error={errors.minSeverity}
      >
        <NativeSelect
          id="minSeverity"
          name="minSeverity"
          disabled={isNews}
          value={isNews ? "none" : severity}
          onChange={(event) => {
            const next = SEVERITIES.find((s) => s === event.target.value);
            if (next) setSeverity(next);
          }}
          className="w-full"
          {...describedBy("minSeverity", {
            hint: true,
            error: errors.minSeverity,
          })}
        >
          {isNews ? (
            <NativeSelectOption value="none">
              Not used for news
            </NativeSelectOption>
          ) : (
            SEVERITIES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {MIN_SEVERITY_LABELS[value]}
              </NativeSelectOption>
            ))
          )}
        </NativeSelect>
      </Field>

      <Field
        id="keywords"
        label="Keywords"
        optional={!isNews}
        hint={`${isNews ? "Required for news. " : ""}Separate with commas. Every keyword must appear in the event as a whole word. Up to 10.`}
        error={errors.keywords}
      >
        <Input
          id="keywords"
          name="keywords"
          autoComplete="off"
          placeholder="japan, tsunami"
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          {...describedBy("keywords", { hint: true, error: errors.keywords })}
        />
      </Field>

      <FieldGroup
        id="destinationIds"
        legend="Destinations"
        error={errors.destinationIds}
      >
        <div className="flex flex-col gap-2">
          {destinations.map((destination) => {
            const kind =
              destination.channelType === "email" ? accountEmail : "Slack";
            return (
              <label
                key={destination.id}
                className="border-input flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm"
              >
                {selected.includes(destination.id) ? (
                  <input
                    type="hidden"
                    name="destinationIds"
                    value={destination.id}
                  />
                ) : null}
                <Checkbox
                  className="mt-0.5"
                  checked={selected.includes(destination.id)}
                  onCheckedChange={(checked) =>
                    toggleDestination(destination.id, checked)
                  }
                />
                <span className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <span>{destination.name}</span>
                  {kind ? (
                    <span className="text-muted-foreground">{kind}</span>
                  ) : null}
                  {destination.status === "broken" ? <BrokenMark /> : null}
                </span>
              </label>
            );
          })}
        </div>
      </FieldGroup>

      {!state.ok && state.message ? (
        <Notice variant="error">{state.message}</Notice>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton
          pendingLabel={editing ? "Saving…" : "Creating…"}
          className="w-full sm:w-auto"
        >
          {editing ? "Save changes" : "Create alert"}
        </SubmitButton>
        <Link
          href="/alerts"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full sm:w-auto",
          )}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
