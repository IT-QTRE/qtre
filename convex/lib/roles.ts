import { v, type Infer } from "convex/values";

export const ROLES = ["super_admin", "admin", "agent", "client"] as const;

export const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("agent"),
  v.literal("client"),
);

export type Role = Infer<typeof roleValidator>;

// "leads" here means property/project inquiries only — the general
// Contact page's GoHighLevel form never touches Convex, so it has no
// resource here at all. `propertySubmissions` (client-submitted properties
// pending review) is a separate, unrelated concept.
export const RESOURCES = [
  "properties",
  "projects",
  "developers",
  "agents",
  "communities",
  "leads",
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
    propertySubmissions: ["read", "create", "update"],
    blogPosts: [],
    mediaItems: ["read", "create"],
    users: [],
    websiteSettings: [],
    auditLogs: [],
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSION_MATRIX[role][resource].includes(action);
}
