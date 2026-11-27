import { FlaskConical } from "lucide-react";
import { cn } from "cn";

/** Marks a simulated event wherever its title appears. */
export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "border-warning bg-warning-muted text-warning inline-flex h-5.5 items-center gap-1 rounded-sm border px-2 align-middle text-xs font-semibold whitespace-nowrap",
        className,
      )}
    >
      <FlaskConical aria-hidden="true" className="size-3" />
      Simulated
    </span>
  );
}

/** One keyword of an alert. */
export function KeywordChip({ children }: { children: string }) {
  return (
    <span className="bg-secondary text-secondary-foreground inline-flex h-5.5 items-center rounded-sm px-2 text-xs font-medium">
      {children}
    </span>
  );
}
