import type { Route } from "next";
import Link from "next/link";

/** The trace mark and the name. The only logo Heads-up has. */
export function Wordmark({ href }: { href: Route }) {
  return (
    <Link
      href={href}
      className="text-foreground inline-flex items-center gap-2 text-base font-bold tracking-tight"
    >
      <svg
        viewBox="0 0 26 16"
        aria-hidden="true"
        className="stroke-primary h-4 w-6.5 fill-none stroke-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="1,9 6,9 9,2 13,14 16,6 18,9 25,9" />
      </svg>
      Heads-up
    </Link>
  );
}
