import { Check, Clock, X } from "lucide-react";
import { cn } from "cn";
import type { SourceStatus as Status } from "@/lib/alerting/sources/catalog";

const statuses = {
  ok: { label: "OK", color: "text-success", Icon: Check },
  late: { label: "Late", color: "text-warning", Icon: Clock },
  failing: { label: "Failing", color: "text-destructive", Icon: X },
} as const;

/** A source's status as an icon and a word. */
export function SourceStatus({ status }: { status: Status }) {
  const { label, color, Icon } = statuses[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold",
        color,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </span>
  );
}
