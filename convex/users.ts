import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { roleValidator } from "./lib/roles";
import { resolveRoleFromClerkMetadata } from "./lib/clerkMetadata";

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
