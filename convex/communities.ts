import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";

const statusValidator = v.union(v.literal("draft"), v.literal("published"), v.literal("archived"));

// Slug uniqueness is per-country here (unlike Developers/Agents' global
// `by_publishing_slug`) — two communities in different countries may
// legitimately share a slug, e.g. "downtown" in both AE and TR.
async function assertSlugAvailable(ctx: MutationCtx, countryCode: string, slug: string, excludeId?: Id<"communities">) {
  const existing = await ctx.db
    .query("communities")
    .withIndex("by_country_and_slug", (q) => q.eq("countryCode", countryCode).eq("publishing.slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use in ${countryCode}`);
  }
}

// Referential-integrity guard: Projects and Properties both reference a
// Community by id (`by_community`) — deleting one out from under them would
// leave a dangling `communityId`.
async function assertNotReferenced(ctx: MutationCtx, communityId: Id<"communities">) {
  const referencingProject = await ctx.db
    .query("projects")
    .withIndex("by_community", (q) => q.eq("communityId", communityId))
    .first();
  if (referencingProject) {
    throw new Error("Cannot delete a community that still has projects referencing it");
  }
  const referencingProperty = await ctx.db
    .query("properties")
    .withIndex("by_community", (q) => q.eq("communityId", communityId))
    .first();
  if (referencingProperty) {
    throw new Error("Cannot delete a community that still has properties referencing it");
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "communities", "read");
    return await ctx.db.query("communities").collect();
  },
});

export const get = query({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "communities", "read");
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: localizedTextValidator,
    city: localizedTextValidator,
    countryCode: v.string(),
    description: v.optional(localizedTextValidator),
    seo: v.optional(seoFieldsValidator),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "communities", "create");
    await assertSlugAvailable(ctx, args.countryCode, args.slug);

    const { slug, status, ...rest } = args;
    const now = Date.now();
    const id = await ctx.db.insert("communities", {
      ...rest,
      publishing: {
        slug,
        status,
        updatedAt: now,
        publishedAt: status === "published" ? now : undefined,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "communities", action: "create", targetId: id });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("communities"),
    name: localizedTextValidator,
    city: localizedTextValidator,
    countryCode: v.string(),
    description: v.optional(localizedTextValidator),
    seo: v.optional(seoFieldsValidator),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "communities", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Community not found");
    }
    await assertSlugAvailable(ctx, args.countryCode, args.slug, args.id);

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
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "communities", action: "update", targetId: id });
  },
});

export const remove = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "communities", "delete");
    await assertNotReferenced(ctx, args.id);
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "communities", action: "delete", targetId: args.id });
  },
});
