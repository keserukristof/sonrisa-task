import type { Route } from "next";
import Link from "next/link";
import { cn } from "cn";

export type FilterOption = { label: string; href: Route; current: boolean };

/**
 * A choice among a few values of one query parameter, as links, so it works
 * without JavaScript: the admin notifications status filter.
 */
export function FilterLinks({
  label,
  options,
}: {
  label: string;
  options: FilterOption[];
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span id="filter-label" className="text-sm font-medium">
        {label}
      </span>
      <nav
        aria-labelledby="filter-label"
        className="border-border bg-card inline-flex flex-wrap gap-1 rounded-md border p-0.5"
      >
        {options.map((option) => (
          <Link
            key={option.label}
            href={option.href}
            aria-current={option.current ? "page" : undefined}
            className={cn(
              "inline-flex h-7 items-center rounded-sm px-2.5 text-sm font-medium",
              option.current
                ? "bg-accent text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
