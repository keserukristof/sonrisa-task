import { Ban, Check, Clock, X } from "lucide-react";
import { cn } from "cn";
import type { NotificationStatus as Status } from "@/lib/alerting/types";

const statuses = {
  pending: { label: "Pending", color: "text-muted-foreground", Icon: Clock },
  sent: { label: "Sent", color: "text-success", Icon: Check },
  failed: { label: "Failed", color: "text-destructive", Icon: X },
  skipped: { label: "Skipped", color: "text-warning", Icon: Ban },
} as const;

/**
 * A notification's status as an icon and a word, with an optional line of
 * detail under it: when it was sent, the next attempt, or the reason.
 * Also used for the result of "Send test", with its own `label`.
 */
export function NotificationStatus({
  status,
  label,
  detail,
  className,
}: {
  status: Status;
  label?: string;
  detail?: string | null;
  className?: string;
}) {
  const { label: defaultLabel, color, Icon } = statuses[status];
  return (
    <div className={cn("text-sm", className)}>
      <span
        className={cn("inline-flex items-center gap-1.5 font-semibold", color)}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {label ?? defaultLabel}
      </span>
      {detail ? <p className="text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
