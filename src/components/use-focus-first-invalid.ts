"use client";

import { useEffect, type RefObject } from "react";

/**
 * Moves focus to the first invalid field of `formRef` each time `result`
 * changes to a failed one. A field marks itself invalid with
 * `aria-invalid="true"` (see `describedBy`); a radio or checkbox group marks
 * its fieldset, and focus goes to the first control inside it.
 */
export function useFocusFirstInvalid(
  formRef: RefObject<HTMLFormElement | null>,
  result: { ok: boolean; fieldErrors?: object | undefined },
): void {
  useEffect(() => {
    if (result.ok || !result.fieldErrors) return;
    const invalid = formRef.current?.querySelector('[aria-invalid="true"]');
    if (invalid instanceof HTMLFieldSetElement) {
      invalid
        .querySelector<HTMLElement>('input,[role="radio"],[role="checkbox"]')
        ?.focus();
    } else if (invalid instanceof HTMLElement) {
      invalid.focus();
    }
  }, [formRef, result]);
}
