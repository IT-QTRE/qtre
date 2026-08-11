import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  UserRound,
  MapPin,
  Building,
  Home,
  Inbox,
  Newspaper,
  Image as ImageIcon,
  Users,
  Settings,
  History,
} from "lucide-react";
import type { Resource } from "@/convex/lib/roles";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  // Omitted for Dashboard — it has no corresponding resource and is
  // always visible. Every other item's resource must match the string
  // used in convex/lib/roles.ts `RESOURCES` for `getVisibleNavItems` below
  // to correctly hide it when a Super Admin disables it for Admin.
  resource?: Resource;
};

// Single source of truth for admin nav — consumed by both the desktop
// sidebar and the mobile header's Sheet drawer so they can never drift
// apart. Only lists screens that actually exist; each later Phase 4
// sub-phase adds its own items here when that screen lands.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Properties", href: "/admin/properties", icon: Home, resource: "properties" },
  { label: "Projects", href: "/admin/projects", icon: Building, resource: "projects" },
  { label: "Blog", href: "/admin/blog", icon: Newspaper, resource: "blogPosts" },
  { label: "Developers", href: "/admin/developers", icon: Building2, resource: "developers" },
  { label: "Communities", href: "/admin/communities", icon: MapPin, resource: "communities" },
  { label: "Agents", href: "/admin/agents", icon: UserRound, resource: "agents" },
  { label: "Leads", href: "/admin/leads", icon: Inbox, resource: "leads" },
  { label: "Media", href: "/admin/media", icon: ImageIcon, resource: "mediaItems" },
  { label: "Users & Roles", href: "/admin/users", icon: Users, resource: "users" },
  { label: "Website Settings", href: "/admin/settings", icon: Settings, resource: "websiteSettings" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: History, resource: "auditLogs" },
];

// Applies a Super Admin's runtime Admin-access restrictions (see
// convex/websiteSettings.ts `updateAdminAccess`) to the shared nav list.
// Super Admin always sees every tab; Dashboard (no `resource`) is always
// visible to whoever is allowed into /admin at all.
export function getVisibleNavItems(role: string, disabledResources: readonly string[]): AdminNavItem[] {
  if (role !== "admin" || disabledResources.length === 0) {
    return ADMIN_NAV_ITEMS;
  }
  return ADMIN_NAV_ITEMS.filter((item) => !item.resource || !disabledResources.includes(item.resource));
}
