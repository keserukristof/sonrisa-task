import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";
import { PageContainer } from "@/components/page-shell";

export const ADMIN_TABS = [
  { id: "overview", label: "Overview", href: "/admin", title: "Overview" },
  { id: "users", label: "Users", href: "/admin/users", title: "Users" },
  { id: "events", label: "Events", href: "/admin/events", title: "Events" },
  {
    id: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    title: "Notifications",
  },
  {
    id: "simulate",
    label: "Simulate",
    href: "/admin/simulate",
    title: "Simulate an event",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  href: Route;
  title: string;
}[];

export type AdminTab = (typeof ADMIN_TABS)[number]["id"];

/**
 * The frame of every admin page: the `<title>`, the one `h1` "Admin" and the
 * tabs (docs/design/screens/admin-overview.md). Render it only after
 * `requireAdmin()`, inside `<Suspense>`: nothing of the admin area may be in
 * a page's static shell, or a non-admin would learn that it exists.
 */
export function AdminFrame({
  current,
  children,
}: {
  current: AdminTab;
  children: ReactNode;
}) {
  const tab = ADMIN_TABS.find((t) => t.id === current) ?? ADMIN_TABS[0];
  return (
    <PageContainer width="list">
      <title>{`${tab.title} · Admin · Heads-up`}</title>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Admin</h1>
      <nav
        aria-label="Admin"
        className="border-border mb-6 flex gap-1 overflow-x-auto border-b"
      >
        {ADMIN_TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={t.id === current ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex h-10 items-center border-b-2 px-3 text-sm whitespace-nowrap",
              t.id === current
                ? "border-primary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground border-transparent font-medium",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </PageContainer>
  );
}

/** What an admin page shows while its admin check runs: nothing revealing. */
export function AdminFrameFallback() {
  return <PageContainer width="list">{null}</PageContainer>;
}
