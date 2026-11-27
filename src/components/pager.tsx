import type { Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * Previous and Next links under a paged list, on `?page=`. Plain links, so
 * they work without JavaScript. Renders nothing when there is one page.
 */
export function Pager({
  pathname,
  page,
  hasNext,
}: {
  pathname: Route;
  /** The current page, from 1. */
  page: number;
  hasNext: boolean;
}) {
  const hasPrevious = page > 1;
  if (!hasPrevious && !hasNext) return null;

  const link = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 pt-4"
    >
      <span className="text-muted-foreground text-sm">Page {page}</span>
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Link href={{ pathname, query: { page: page - 1 } }} className={link}>
            Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={{ pathname, query: { page: page + 1 } }} className={link}>
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
