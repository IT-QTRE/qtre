"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getVisibleNavItems } from "./admin-nav-items";

type AdminMobileHeaderProps = {
  userName: string;
  userRole: string;
  // Plain strings only — icons are React components and must never cross
  // the Server->Client Component boundary, so the filtered nav list is
  // computed here, inside the client module, instead of being passed in
  // as a prop from the (server) layout.
  disabledResources: readonly string[];
};

export function AdminMobileHeader({ userName, userRole, disabledResources }: AdminMobileHeaderProps) {
  const pathname = usePathname();
  const navItems = getVisibleNavItems(userRole, disabledResources);
  const currentItem =
    navItems.find((item) => (item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href))) ??
    navItems[0];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
      <span className="font-heading font-semibold">{currentItem.label}</span>
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation menu" />}>
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="border-b border-sidebar-border">
            <SheetTitle className="text-sidebar-foreground">QuickTalk Real Estate</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navItems.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <SheetClose
                  key={item.href}
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    />
                  }
                >
                  <item.icon className={cn("size-4", active && "text-sidebar-primary")} />
                  {item.label}
                </SheetClose>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <p className="truncate px-3 pb-2 text-xs text-sidebar-foreground/60">
              {userName} · {userRole}
            </p>
            <SignOutButton>
              <Button variant="ghost" className="w-full justify-start">
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
