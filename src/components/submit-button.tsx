"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

/**
 * A form's submit button. While the form's action runs it is disabled and
 * shows `pendingLabel`: "Saving…", "Signing in…". Focus stays on it.
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      {...props}
      className={cn(
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        props.className,
      )}
      // Stays focusable while pending (aria-disabled, no click): a real
      // `disabled` button drops focus to <body> in the middle of a submit.
      focusableWhenDisabled
      disabled={pending || props.disabled}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
