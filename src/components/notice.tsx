import { Check, CircleAlert, FlaskConical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

const variants = {
  success: {
    box: "border-success bg-success-muted",
    icon: "text-success",
    Icon: Check,
    role: "status",
  },
  error: {
    box: "border-destructive bg-destructive-muted",
    icon: "text-destructive",
    Icon: CircleAlert,
    role: "alert",
  },
  simulated: {
    box: "border-warning bg-warning-muted",
    icon: "text-warning",
    Icon: FlaskConical,
    role: "note",
  },
} as const;

/**
 * An inline message in the page flow. Heads-up has no toasts: feedback is a
 * Notice between the page title and the content, or above a form's button.
 * Success is announced politely (`role="status"`), an error at once (`role="alert"`).
 */
export function Notice({
  variant,
  children,
  className,
}: {
  variant: keyof typeof variants;
  children: ReactNode;
  className?: string;
}) {
  const { box, icon, Icon, role } = variants[variant];
  return (
    <div
      role={role}
      className={cn(
        "text-foreground flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm",
        box,
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", icon)} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
