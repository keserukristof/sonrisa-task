import type { ReactNode } from "react";
import { cn } from "cn";

const widths = {
  /** Lists: alerts, notifications, destinations. */
  list: "max-w-4xl",
  /** Forms: the alert form, simulate. */
  form: "max-w-xl",
  /** Account cards: sign in, sign up, message pages. */
  narrow: "max-w-md",
} as const;

/** The `<main>` of every page: centred, with the page padding. */
export function PageContainer({
  width,
  children,
  className,
}: {
  width: keyof typeof widths;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full flex-1 p-4 md:p-6",
        widths[width],
        className,
      )}
    >
      {children}
    </main>
  );
}

/** The page's one `h1`, with its primary action on the right. */
export function PageHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {action}
    </div>
  );
}
