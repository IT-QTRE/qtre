import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  UserRound,
  MapPin,
  Building,
  Home,
  Inbox,
  Landmark,
  Newspaper,
  Image as ImageIcon,
  Users,
  Settings,
  History,
} from "lucide-react";
import type { Resource } from "@/convex/lib/roles";

export type AdminNavGroupId = "catalog" | "people" | "publishing" | "system";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  group: AdminNavGroupId;
  // Omitted for Overview — it has no corresponding resource and is
  // always visible. Every other item's resource must match the string
  // used in convex/lib/roles.ts `RESOURCES` for `getVisibleNavItems` below
  // to correctly hide it when a Super Admin disables it for Admin.
  resource?: Resource;
};

export const NAV_GROUP_LABELS: Record<AdminNavGroupId, string> = {
  catalog: "Catalog",
  people: "People",
  publishing: "Publishing",
  system: "System",
};

const NAV_GROUP_ORDER: AdminNavGroupId[] = ["catalog", "people", "publishing", "system"];

// Single source of truth for admin nav — consumed by both the desktop
// sidebar and the mobile header's Sheet drawer so they can never drift
// apart. Only lists screens that actually exist; each later Phase 4
// sub-phase adds its own items here when that screen lands.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, group: "catalog" },
  { label: "Properties", href: "/admin/properties", icon: Home, group: "catalog", resource: "properties" },
  { label: "Projects", href: "/admin/projects", icon: Building, group: "catalog", resource: "projects" },
  { label: "Developers", href: "/admin/developers", icon: Building2, group: "catalog", resource: "developers" },
  { label: "Communities", href: "/admin/communities", icon: MapPin, group: "catalog", resource: "communities" },
  { label: "Media", href: "/admin/media", icon: ImageIcon, group: "catalog", resource: "mediaItems" },
  { label: "Agents", href: "/admin/agents", icon: UserRound, group: "people", resource: "agents" },
  { label: "Leads", href: "/admin/leads", icon: Inbox, group: "people", resource: "leads" },
  { label: "Service leads", href: "/admin/service-leads", icon: Landmark, group: "people", resource: "serviceLeads" },
  { label: "Blog", href: "/admin/blog", icon: Newspaper, group: "publishing", resource: "blogPosts" },
  { label: "Users & Roles", href: "/admin/users", icon: Users, group: "system", resource: "users" },
  { label: "Website Settings", href: "/admin/settings", icon: Settings, group: "system", resource: "websiteSettings" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: History, group: "system", resource: "auditLogs" },
];

export function isAdminNavActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

// Applies a Super Admin's runtime Admin-access restrictions (see
// convex/websiteSettings.ts `updateAdminAccess`) to the shared nav list.
// Super Admin always sees every tab; Overview (no `resource`) is always
// visible to whoever is allowed into /admin at all.
export function getVisibleNavItems(role: string, disabledResources: readonly string[]): AdminNavItem[] {
  if (role !== "admin" || disabledResources.length === 0) {
    return ADMIN_NAV_ITEMS;
  }
  return ADMIN_NAV_ITEMS.filter((item) => !item.resource || !disabledResources.includes(item.resource));
}

export function getVisibleNavGroups(role: string, disabledResources: readonly string[]) {
  const items = getVisibleNavItems(role, disabledResources);
  return NAV_GROUP_ORDER.flatMap((id) => {
    const groupItems = items.filter((item) => item.group === id);
    return groupItems.length > 0 ? [{ id, label: NAV_GROUP_LABELS[id], items: groupItems }] : [];
  });
}

export function formatAdminRole(role: string) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return role;
}
