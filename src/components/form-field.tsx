import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/**
 * The ids a control must reference so its hint or error is announced:
 * `<Input id="name" {...describedBy("name", { hint: true, error })} />`.
 * The error replaces the hint.
 */
export function describedBy(
  id: string,
  { hint = false, error }: { hint?: boolean; error?: string | undefined },
): { "aria-describedby"?: string; "aria-invalid"?: true } {
  if (error) return { "aria-describedby": `${id}-error`, "aria-invalid": true };
  if (hint) return { "aria-describedby": `${id}-hint` };
  return {};
}

export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p
      id={`${id}-error`}
      className="text-destructive flex items-start gap-1.5 text-sm font-medium"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

/**
 * A labelled control with an optional hint and an error under it. For a
 * single control; a radio or checkbox group uses `FieldGroup`.
 */
export function Field({
  id,
  label,
  optional = false,
  hint,
  error,
  children,
}: {
  /** The control's id. The hint and error ids derive from it. */
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional ? (
          <span className="text-muted-foreground font-normal">(optional)</span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <FieldError id={id}>{error}</FieldError>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A group of radios or checkboxes with one legend and one error. */
export function FieldGroup({
  id,
  legend,
  hint,
  error,
  children,
}: {
  id: string;
  legend: string;
  hint?: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <fieldset
      className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0"
      {...describedBy(id, { hint: Boolean(hint), error })}
    >
      <legend className="mb-1.5 p-0 text-sm font-medium">{legend}</legend>
      {children}
      {error ? (
        <FieldError id={id}>{error}</FieldError>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-sm">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
