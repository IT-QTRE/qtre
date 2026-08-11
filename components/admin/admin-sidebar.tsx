"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getVisibleNavItems } from "./admin-nav-items";

type AdminSidebarProps = {
  userName: string;
  userRole: string;
  // Plain strings only — icons are React components and must never cross
  // the Server->Client Component boundary, so the filtered nav list is
  // computed here, inside the client module, instead of being passed in
  // as a prop from the (server) layout.
  disabledResources: readonly string[];
};

export function AdminSidebar({ userName, userRole, disabledResources }: AdminSidebarProps) {
  const pathname = usePathname();
  const navItems = getVisibleNavItems(userRole, disabledResources);

  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4 font-heading font-semibold">
        QuickTalk Real Estate
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          // Exact match for the dashboard root; prefix match for everything
          // else so a nested edit route (e.g. /admin/developers/123) still
          // highlights its parent list item.
          const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("size-4", active && "text-sidebar-primary")} />
              {item.label}
            </Link>
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
    </aside>
  );
}
