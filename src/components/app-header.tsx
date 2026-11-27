import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { NavLinks, type NavItem } from "./nav-links";
import { Wordmark } from "./wordmark";

const userItems: NavItem[] = [
  { href: "/alerts", label: "Alerts", section: "/alerts" },
  { href: "/notifications", label: "Notifications", section: "/notifications" },
  { href: "/destinations", label: "Destinations", section: "/destinations" },
];

const adminItem: NavItem = {
  href: "/admin",
  label: "Admin",
  section: "/admin",
};

/**
 * The header of every signed-in page. A row of links from 768px; below it, a
 * Menu button that opens a panel. `signOutAction` is passed in, so this shared
 * component does not import a feature.
 */
export function AppHeader({
  email,
  isAdmin,
  signOutAction,
}: {
  email: string | null;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}) {
  const items = isAdmin ? [...userItems, adminItem] : userItems;

  return (
    <header className="border-border bg-card flex h-14 items-center gap-6 border-b px-4 md:px-6">
      <Wordmark href="/alerts" />
      <NavLinks items={items} />
      <div className="ml-auto flex items-center gap-2">
        {email ? (
          <span className="text-muted-foreground hidden text-sm md:inline">
            {email}
          </span>
        ) : null}
        <form action={signOutAction} className="hidden md:block">
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
        <MobileMenu items={items} email={email} signOutAction={signOutAction} />
      </div>
    </header>
  );
}

/** The header's shape while the session is being read. */
export function AppHeaderFallback() {
  return (
    <header className="border-border bg-card flex h-14 items-center gap-6 border-b px-4 md:px-6">
      <Wordmark href="/alerts" />
    </header>
  );
}
