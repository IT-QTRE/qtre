"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminAccountFooter } from "./admin-account-footer";
import { AdminBrand } from "./admin-brand";
import { AdminNav } from "./admin-nav";
import { getVisibleNavItems, isAdminNavActive } from "./admin-nav-items";
import { usePathname } from "next/navigation";

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
    navItems.find((item) => isAdminNavActive(item.href, pathname)) ?? navItems[0];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <span className="min-w-0 truncate font-heading text-sm font-semibold">{currentItem?.label ?? "Overview"}</span>
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="min-h-11 min-w-11 touch-manipulation" aria-label="Open navigation menu" />}>
          <Menu className="size-5" aria-hidden />
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="flex w-72 flex-col overflow-y-auto overscroll-contain bg-sidebar p-0 pb-[env(safe-area-inset-bottom)] text-sidebar-foreground"
        >
          <SheetHeader className="flex-row items-center gap-1 border-b border-sidebar-border p-0 pe-1">
            <SheetTitle className="sr-only">QuickTalk Real Estate</SheetTitle>
            <div className="min-w-0 flex-1">
              <AdminBrand />
            </div>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative min-h-11 min-w-11 shrink-0 touch-manipulation active:translate-y-0"
                  aria-label="Close navigation menu"
                />
              }
            >
              <X className="size-5" aria-hidden />
            </SheetClose>
          </SheetHeader>
          <AdminNav
            userRole={userRole}
            disabledResources={disabledResources}
            wrapLink={(link) => <SheetClose nativeButton={false} render={link} />}
          />
          <AdminAccountFooter userName={userName} userRole={userRole} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
