import { v, type Infer } from "convex/values";

export const ROLES = ["super_admin", "admin", "agent", "client"] as const;

export const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("agent"),
  v.literal("client"),
);

export type Role = Infer<typeof roleValidator>;

// "leads" = listing/project inquiries. "serviceLeads" = visa/license
// wizard on Services pages. Contact form + public chat stay in
// GoHighLevel and have no resource here. `propertySubmissions` is
// client-submitted properties pending review — unrelated to either inbox.
export const RESOURCES = [
  "properties",
  "projects",
  "developers",
  "agents",
  "communities",
  "leads",
  "serviceLeads",
  "propertySubmissions",
  "blogPosts",
  "mediaItems",
  "users",
  "websiteSettings",
  "auditLogs",
] as const;

export type Resource = (typeof RESOURCES)[number];

export type Action = "read" | "create" | "update" | "delete";

// This grid covers *general* role capability per resource. Row-level
// scoping — an Agent editing only their own assigned properties, a Client
// seeing only their own submissions — is enforced separately in
// convex/lib/permissions.ts (Task 12) and Phase 4's queries/mutations via an
// explicit ownership check (e.g. `property.agentId === user._id`), not by
// this matrix alone.
export const PERMISSION_MATRIX: Record<Role, Record<Resource, Action[]>> = {
  super_admin: {
    properties: ["read", "create", "update", "delete"],
    projects: ["read", "create", "update", "delete"],
    developers: ["read", "create", "update", "delete"],
    agents: ["read", "create", "update", "delete"],
    communities: ["read", "create", "update", "delete"],
    leads: ["read", "create", "update", "delete"],
    serviceLeads: ["read", "create", "update", "delete"],
    propertySubmissions: ["read", "create", "update", "delete"],
    blogPosts: ["read", "create", "update", "delete"],
    mediaItems: ["read", "create", "update", "delete"],
    users: ["read", "create", "update", "delete"],
    websiteSettings: ["read", "create", "update", "delete"],
    auditLogs: ["read"],
  },
  admin: {
    properties: ["read", "create", "update", "delete"],
    projects: ["read", "create", "update", "delete"],
    developers: ["read", "create", "update", "delete"],
    agents: ["read", "create", "update", "delete"],
    communities: ["read", "create", "update", "delete"],
    leads: ["read", "create", "update", "delete"],
    serviceLeads: ["read", "create", "update", "delete"],
    propertySubmissions: ["read", "create", "update", "delete"],
    blogPosts: ["read", "create", "update", "delete"],
    mediaItems: ["read", "create", "update", "delete"],
    // Cannot delete user records, and cannot create/manage other Admin
    // accounts (Super Admin only per the roles/portals spec) — that
    // narrower restriction is enforced in Phase 2's user-management
    // mutations, not expressible in this per-resource grid.
    users: ["read", "create", "update"],
    websiteSettings: ["read", "update"],
    auditLogs: ["read"],
  },
  agent: {
    properties: ["read", "update"],
    projects: ["read", "update"],
    developers: ["read"],
    agents: ["read"],
    communities: ["read"],
    leads: ["read", "update"],
    serviceLeads: [],
    propertySubmissions: ["read", "update"],
    blogPosts: [],
    mediaItems: ["read", "create", "update", "delete"],
    users: [],
    websiteSettings: [],
    auditLogs: [],
  },
  client: {
    properties: [],
    projects: [],
    developers: [],
    agents: [],
    communities: ["read"],
    leads: [],
    serviceLeads: [],
    propertySubmissions: ["read", "create", "update"],
    blogPosts: [],
    mediaItems: ["read", "create", "delete"],
    users: [],
    websiteSettings: [],
    auditLogs: [],
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSION_MATRIX[role][resource].includes(action);
}

// Every resource, as a validator — used for the general-purpose
// `Resource` shape wherever a Convex arg/schema field needs to hold one.
export const resourceValidator = v.union(
  v.literal("properties"),
  v.literal("projects"),
  v.literal("developers"),
  v.literal("agents"),
  v.literal("communities"),
  v.literal("leads"),
  v.literal("serviceLeads"),
  v.literal("propertySubmissions"),
  v.literal("blogPosts"),
  v.literal("mediaItems"),
  v.literal("users"),
  v.literal("websiteSettings"),
  v.literal("auditLogs"),
);

// Resources that have their own top-level admin nav tab. A Super Admin can
// runtime-toggle Admin-role access to any of these (see
// convex/websiteSettings.ts `updateAdminAccess`); Super Admin itself is
// never affected. `propertySubmissions` is deliberately excluded — it has
// no dedicated nav tab, so there is nothing to toggle.
export const toggleableResourceValidator = v.union(
  v.literal("properties"),
  v.literal("projects"),
  v.literal("developers"),
  v.literal("agents"),
  v.literal("communities"),
  v.literal("leads"),
  v.literal("serviceLeads"),
  v.literal("blogPosts"),
  v.literal("mediaItems"),
  v.literal("users"),
  v.literal("websiteSettings"),
  v.literal("auditLogs"),
);

export type ToggleableResource = Infer<typeof toggleableResourceValidator>;

export const ADMIN_TOGGLEABLE_RESOURCES: ToggleableResource[] = [
  "properties",
  "projects",
  "developers",
  "agents",
  "communities",
  "leads",
  "serviceLeads",
  "blogPosts",
  "mediaItems",
  "users",
  "websiteSettings",
  "auditLogs",
];
