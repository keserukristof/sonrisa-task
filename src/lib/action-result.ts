import type { z } from "zod";

/**
 * What every Server Action returns to its form. Expected failures are values,
 * not exceptions: field errors go next to their fields, `message` goes in a
 * Notice above the submit button.
 */
export type ActionResult<Field extends string = string> =
  | { ok: true; message?: string }
  | {
      ok: false;
      message?: string;
      /** A machine-readable reason, when the form shows something other than the message. */
      code?: string;
      fieldErrors?: Partial<Record<Field, string>>;
    };

/** The state a form starts in with `useActionState`. */
export const initialActionResult: ActionResult<never> = { ok: true };

/** The first message for each field of a failed Zod parse. */
export function fieldErrorsFrom<Field extends string>(
  error: z.ZodError,
): Partial<Record<Field, string>> {
  const errors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
