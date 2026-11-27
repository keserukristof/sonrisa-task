"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export type NavItem = { href: Route; label: string; section: string };

/** The section a path belongs to: "/alerts/new" is in "/alerts". */
function isCurrent(pathname: string, section: string): boolean {
  return pathname === section || pathname.startsWith(`${section}/`);
}

/** The main navigation as a row of links, for the header from 768px. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="hidden items-stretch gap-1 self-stretch md:flex"
    >
      {items.map((item) => {
        const current = isCurrent(pathname, item.section);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex items-center border-y-2 border-transparent px-2.5 text-sm font-medium",
              current
                ? "border-b-primary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The same links as rows, for the menu panel below 768px. */
export function NavRows({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const current = isCurrent(pathname, item.section);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={current ? "page" : undefined}
            className={cn(
              "text-foreground flex h-11 items-center rounded-md px-3 text-base font-medium",
              current ? "bg-accent font-semibold" : "hover:bg-accent",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
