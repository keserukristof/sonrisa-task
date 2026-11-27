import { Unplug } from "lucide-react";
import { cn } from "cn";

/**
 * Marks a broken Slack destination wherever it is named, by word and icon,
 * never colour alone: "Broken" on the alert form, "Incident room (broken)"
 * on the alerts list, "Broken." before the reason on /destinations.
 */
export function BrokenMark({
  children = "Broken",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-destructive inline-flex items-center gap-1 font-semibold whitespace-nowrap",
        className,
      )}
    >
      <Unplug aria-hidden="true" className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}
