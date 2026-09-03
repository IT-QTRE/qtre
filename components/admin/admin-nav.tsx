"use client";

import type { ComponentType, ReactElement, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthedQuery } from "./use-authed-query";
import { getVisibleNavGroups, isAdminNavActive } from "./admin-nav-items";

const itemClass = (active: boolean) =>
  cn(
    "flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-sm touch-manipulation transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-primary/10 font-medium text-primary"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
  );

export function AdminNav({
  userRole,
  disabledResources,
  wrapLink,
}: {
  userRole: string;
  disabledResources: readonly string[];
  wrapLink?: (link: ReactElement) => ReactNode;
}) {
  const pathname = usePathname();
  const groups = getVisibleNavGroups(userRole, disabledResources);
  const showLeads = groups.some((group) => group.items.some((item) => item.href === "/admin/leads"));
  const newLeadCount = useAuthedQuery(api.leads.newCount, showLeads ? {} : "skip");

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 pb-2 font-heading text-[0.65rem] font-medium tracking-[0.14em] text-sidebar-foreground/70 uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isAdminNavActive(item.href, pathname);
              const Icon = item.icon as ComponentType<{ className?: string }>;
              const leadCount = item.href === "/admin/leads" && newLeadCount ? newLeadCount : 0;
              const link = (
                <Link
                  href={item.href}
                  className={itemClass(active)}
                  aria-label={leadCount > 0 ? `${item.label}, ${leadCount} new` : undefined}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {leadCount > 0 ? (
                    <Badge
                      variant="default"
                      className="ms-auto h-5 min-w-5 rounded-full px-1.5 text-[0.65rem] tabular-nums"
                      aria-hidden
                    >
                      {leadCount}
                    </Badge>
                  ) : null}
                </Link>
              );
              return <div key={item.href}>{wrapLink ? wrapLink(link) : link}</div>;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
