"use client";

import { AdminAccountFooter } from "./admin-account-footer";
import { AdminBrand } from "./admin-brand";
import { AdminNav } from "./admin-nav";

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
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="shrink-0 border-b border-sidebar-border">
        <AdminBrand />
      </div>
      <AdminNav userRole={userRole} disabledResources={disabledResources} />
      <AdminAccountFooter userName={userName} userRole={userRole} />
    </aside>
  );
}
