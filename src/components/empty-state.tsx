import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * What a data view shows when it has nothing yet: what belongs here, and the
 * action that fills it. Sits inside the same card the list would use.
 */
export function EmptyState({
  icon: Icon,
  iconClassName,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  children: ReactNode;
  /** One primary button or link. */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Icon
        aria-hidden="true"
        className={cn("text-primary size-6", iconClassName)}
      />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm">{children}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
