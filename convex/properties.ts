import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole, ForbiddenError, assertOwnsIfAdmin, isHiddenFromAdmin } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";
import { propertySharedFactsValidator } from "./lib/propertyFacts";

const statusValidator = v.union(v.literal("draft"), v.literal("published"), v.literal("archived"));
const listingStatusValidator = v.union(
  v.literal("for_sale"),
  v.literal("for_rent"),
  v.literal("sold"),
  v.literal("rented"),
  v.literal("off_market"),
);

// Global uniqueness (like Developers/Agents) — nothing in the schema scopes
// a property's slug by country the way Communities does.
async function assertSlugAvailable(ctx: MutationCtx, slug: string, excludeId?: Id<"properties">) {
  const existing = await ctx.db
    .query("properties")
    .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

// The permission matrix grants the `agent` role "update" on `properties`
// (convex/lib/roles.ts), but per that file's own doc comment, row-level
// scoping — an Agent editing only their *own* assigned property — is
// enforced here, not by the matrix. `properties.agentId` points at an
// `agents` row, not a `users` row, so "own" means "the `agents` row whose
// `userId` is this actor's `users._id`" — resolved via `agents`' `by_user`
// index, then compared against the property's `agentId`.
async function assertCanUpdate(ctx: MutationCtx, actor: { _id: Id<"users">; role: string }, existing: { agentId?: Id<"agents"> }) {
  if (actor.role !== "agent") {
    return;
  }
  const agentProfile = await ctx.db
    .query("agents")
    .withIndex("by_user", (q) => q.eq("userId", actor._id))
    .unique();
  if (!agentProfile || existing.agentId !== agentProfile._id) {
    throw new ForbiddenError("Agents can only update their own assigned properties");
  }
}

const mutationArgs = {
  ...propertySharedFactsValidator.fields,
  title: localizedTextValidator,
  description: localizedTextValidator,
  city: localizedTextValidator,
  coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  listingStatus: listingStatusValidator,
  amenities: v.optional(v.array(v.string())),
  communityId: v.optional(v.id("communities")),
  developerId: v.optional(v.id("developers")),
  projectId: v.optional(v.id("projects")),
  agentId: v.optional(v.id("agents")),
  seo: v.optional(seoFieldsValidator),
  slug: v.string(),
  status: statusValidator,
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const actor = await requireRole(ctx, "properties", "read");
    if (actor.role === "admin") {
      return await ctx.db
        .query("properties")
        .withIndex("by_created_by", (q) => q.eq("createdBy", actor._id))
        .collect();
    }
    return await ctx.db.query("properties").collect();
  },
});

export const get = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "properties", "read");
    const property = await ctx.db.get(args.id);
    if (!property || isHiddenFromAdmin(actor, property.createdBy)) {
      return null;
    }
    return property;
  },
});

// Minimal, unrestricted-by-owner lookups for surfaces that must resolve a
// property's name across Admins even though the full row is Admin-scoped —
// e.g. the Leads table/detail view, where a lead can point at any Admin's
// property. Exposes only `_id` + display title, never the full document.
export const listNames = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "properties", "read");
    const properties = await ctx.db.query("properties").collect();
    return properties.map((property) => ({ _id: property._id, title: property.title.en }));
  },
});

export const getName = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "properties", "read");
    const property = await ctx.db.get(args.id);
    return property ? { _id: property._id, title: property.title.en } : null;
  },
});

export const create = mutation({
  args: mutationArgs,
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "properties", "create");
    await assertSlugAvailable(ctx, args.slug);

    const { slug, status, ...rest } = args;
    const now = Date.now();
    const id = await ctx.db.insert("properties", {
      ...rest,
      createdBy: actor._id,
      publishing: {
        slug,
        status,
        updatedAt: now,
        publishedAt: status === "published" ? now : undefined,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "properties", action: "create", targetId: id });
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("properties"), ...mutationArgs },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "properties", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Property not found");
    }
    await assertCanUpdate(ctx, actor, existing);
    assertOwnsIfAdmin(actor, existing.createdBy, "Admins can only update properties they created");
    await assertSlugAvailable(ctx, args.slug, args.id);

    const { id, slug, status, ...rest } = args;
    const now = Date.now();
    await ctx.db.patch(id, {
      ...rest,
      publishing: {
        slug,
        status,
        updatedAt: now,
        publishedAt: status === "published" ? (existing.publishing.publishedAt ?? now) : existing.publishing.publishedAt,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "properties", action: "update", targetId: id });
  },
});

export const remove = mutation({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "properties", "delete");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Property not found");
    }
    assertOwnsIfAdmin(actor, existing.createdBy, "Admins can only delete properties they created");
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "properties", action: "delete", targetId: args.id });
  },
});
