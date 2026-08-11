import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { roleValidator, toggleableResourceValidator, type Role } from "./lib/roles";
import { resolveRoleFromClerkMetadata } from "./lib/clerkMetadata";
import { ForbiddenError, getCurrentUser, requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";

function isAdminOrAbove(role: Role) {
  return role === "admin" || role === "super_admin";
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

// Used by admin screens (e.g. the Agent edit form's read-only "linked
// account" display) to resolve a `userId` reference to its email — never
// exposes more than an admin can already see via the Users list.
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "users", "read");
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "users", "read");
    return await ctx.db.query("users").collect();
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "users", "update");
    if (args.id === actor._id) {
      throw new Error("Cannot change your own role");
    }
    const target = await ctx.db.get(args.id);
    if (!target) {
      throw new Error("User not found");
    }
    if (actor.role === "admin" && (isAdminOrAbove(target.role) || isAdminOrAbove(args.role))) {
      throw new ForbiddenError("Admins cannot manage Admin or Super Admin accounts");
    }
    await ctx.db.patch(args.id, { role: args.role });
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "users",
      action: "update_role",
      targetId: args.id,
    });
  },
});

// Super Admin-only, and only ever targets an "admin"-role account.
// Deliberately bypasses `requireRole`'s generic users:update grant — admin
// also holds that permission, and reusing it here would let an admin
// re-enable itself or another admin, a privilege escalation. This mirrors
// `updateRole`'s bespoke admin-asymmetric guard: a hard role check the flat
// permission matrix can't express.
export const updateResourceAccess = mutation({
  args: {
    id: v.id("users"),
    disabledResources: v.array(toggleableResourceValidator),
  },
  handler: async (ctx, args) => {
    const actor = await getCurrentUser(ctx);
    if (actor.role !== "super_admin") {
      throw new ForbiddenError("Only Super Admin can manage Admin access");
    }
    const target = await ctx.db.get(args.id);
    if (!target) {
      throw new Error("User not found");
    }
    if (target.role !== "admin") {
      throw new ForbiddenError("Access restrictions only apply to Admin accounts");
    }
    await ctx.db.patch(args.id, { disabledResources: args.disabledResources });
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "users",
      action: "update_resource_access",
      targetId: args.id,
      details: JSON.stringify(args.disabledResources),
    });
    return args.id;
  },
});

export const getByTokenIdentifier = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
  },
});

export const upsert = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    if (existing) {
      // Self-heal a blank/stale email or name captured on an earlier visit
      // (e.g. before Clerk's identity claims were fully populated for this
      // account). Role is deliberately never touched here — Convex is the
      // sole source of truth for role after initial provisioning.
      const patch: Partial<Pick<Doc<"users">, "email" | "name">> = {};
      if (args.email && args.email !== existing.email) {
        patch.email = args.email;
      }
      if (args.name && args.name !== existing.name) {
        patch.name = args.name;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }
    return await ctx.db.insert("users", { ...args, createdAt: Date.now() });
  },
});

// Called by the Agent/Client Portal layouts (a later task, not built by you)
// on every visit. Cheap no-op once a row exists — only hits Clerk's Backend
// API on a brand-new identity's very first visit. This is an `action` (not
// a `mutation`) specifically because reading Clerk's API is a
// non-deterministic external HTTP call, which mutations must never do.
export const ensureUserProvisioned = action({
  args: {},
  handler: async (ctx): Promise<Id<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Same-file ctx.runQuery/runMutation calls need an explicit return type
    // annotation (TypeScript circularity limitation) — hence the
    // `Doc<"users"> | null` and `Id<"users">` annotations below.
    const existing: Doc<"users"> | null = await ctx.runQuery(internal.users.getByTokenIdentifier, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (existing) {
      return existing._id;
    }

    const response = await fetch(`https://api.clerk.com/v1/users/${identity.subject}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    const role = response.ok
      ? resolveRoleFromClerkMetadata((await response.json()).public_metadata)
      : "client";

    const userId: Id<"users"> = await ctx.runMutation(internal.users.upsert, {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "",
      name: identity.name ?? "Unknown",
      role,
    });
    return userId;
  },
});
