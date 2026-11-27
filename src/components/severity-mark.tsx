import { cn } from "cn";
import {
  MIN_SEVERITY_LABELS,
  SEVERITY_LABELS,
  severityRank,
  type Severity,
} from "@/lib/alerting/types";

const colors: Record<Severity, string> = {
  low: "text-severity-low",
  moderate: "text-severity-moderate",
  high: "text-severity-high",
  critical: "text-severity-critical",
};

const barHeights = ["h-1.25", "h-2", "h-2.75", "h-3.5"] as const;

/**
 * The severity mark: four rising bars and the level's word. The word carries
 * the meaning; bars and colour only speed up scanning.
 *
 * - `kind="level"` (default): an event's severity, "High".
 * - `kind="minimum"`: an alert's minimum, "High and above".
 * - `severity={null}`: a news alert, "Any severity", without bars.
 */
export function SeverityMark({
  severity,
  kind = "level",
  className,
}: {
  severity: Severity | null;
  kind?: "level" | "minimum";
  className?: string;
}) {
  if (severity === null) {
    return (
      <span
        className={cn(
          "text-muted-foreground text-sm whitespace-nowrap",
          className,
        )}
      >
        Any severity
      </span>
    );
  }

  const filled = severityRank(severity);
  const label =
    kind === "minimum"
      ? MIN_SEVERITY_LABELS[severity]
      : SEVERITY_LABELS[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
        colors[severity],
        className,
      )}
    >
      <span aria-hidden="true" className="inline-flex h-3.5 items-end gap-0.5">
        {barHeights.map((height, index) => (
          <span
            key={height}
            className={cn(
              "w-1 rounded-xs",
              height,
              index < filled ? "bg-current" : "bg-severity-track",
            )}
          />
        ))}
      </span>
      {label}
    </span>
  );
}
