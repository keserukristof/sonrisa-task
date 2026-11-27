"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * A form's submit button. While the form's action runs it is disabled and
 * shows `pendingLabel`: "Saving…", "Signing in…".
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
      disabled={pending || props.disabled}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
