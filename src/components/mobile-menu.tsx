"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavRows, type NavItem } from "./nav-links";

/** The header's menu below 768px: the links, the account email and sign out in a panel. */
export function MobileMenu({
  items,
  email,
  signOutAction,
}: {
  items: NavItem[];
  email: string | null;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" className="md:hidden" />}>
        <Menu aria-hidden="true" />
        Menu
      </SheetTrigger>
      <SheetContent side="right" className="shadow-overlay w-70 gap-1 p-4">
        <SheetHeader className="p-0 pb-2 pl-3">
          <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col gap-1">
          <NavRows items={items} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="border-border my-2 border-t" />
        {email ? (
          <p className="text-muted-foreground px-3 text-sm break-all">
            {email}
          </p>
        ) : null}
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-foreground hover:bg-accent flex h-11 w-full items-center rounded-md px-3 text-base font-medium"
          >
            Sign out
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
