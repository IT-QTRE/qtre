"use client";

import { LogOut } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { formatAdminRole } from "./admin-nav-items";

export function AdminAccountFooter({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  return (
    <div className="mt-auto border-t border-sidebar-border p-3">
      <p className="min-w-0 truncate px-3 pb-1 text-sm font-medium text-sidebar-foreground" translate="no">
        {userName}
      </p>
      <p className="min-w-0 truncate px-3 pb-3 text-xs text-sidebar-foreground/70">{formatAdminRole(userRole)}</p>
      <SignOutButton redirectUrl="/sign-in">
        <Button
          variant="outline"
          className="h-auto min-h-11 w-full justify-center rounded-md px-3 touch-manipulation hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </SignOutButton>
    </div>
  );
}
