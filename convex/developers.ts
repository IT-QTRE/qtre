import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { nextCatalogRank } from "./lib/catalogRank";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";

const statusValidator = v.union(v.literal("draft"), v.literal("published"), v.literal("archived"));

// Convex has no unique-index constraint, so slug uniqueness is enforced
// here in the mutation instead. Developers/Agents check this globally
// (via `by_publishing_slug`); Communities checks per-country instead (see
// convex/communities.ts) since two communities in different countries may
// legitimately share a slug.
async function assertSlugAvailable(ctx: MutationCtx, slug: string, excludeId?: Id<"developers">) {
  const existing = await ctx.db
    .query("developers")
    .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

// Referential-integrity guard: Projects and Properties both reference a
// Developer by id (`by_developer`) — deleting one out from under them would
// leave a dangling `developerId`.
async function assertNotReferenced(ctx: MutationCtx, developerId: Id<"developers">) {
  const referencingProject = await ctx.db
    .query("projects")
    .withIndex("by_developer", (q) => q.eq("developerId", developerId))
    .first();
  if (referencingProject) {
    throw new Error("Cannot delete a developer that still has projects referencing it");
  }
  const referencingProperty = await ctx.db
    .query("properties")
    .withIndex("by_developer", (q) => q.eq("developerId", developerId))
    .first();
  if (referencingProperty) {
    throw new Error("Cannot delete a developer that still has properties referencing it");
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "developers", "read");
    return await ctx.db.query("developers").collect();
  },
});

export const get = query({
  args: { id: v.id("developers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "developers", "read");
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "developers", "create");
    await assertSlugAvailable(ctx, args.slug);

    const { slug, status, ...rest } = args;
    const now = Date.now();
    const rank = await nextCatalogRank(ctx, "developers");
    const id = await ctx.db.insert("developers", {
      ...rest,
      ...(rank != null ? { rank } : {}),
      publishing: {
        slug,
        status,
        updatedAt: now,
        publishedAt: status === "published" ? now : undefined,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "developers", action: "create", targetId: id });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("developers"),
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "developers", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Developer not found");
    }
    await assertSlugAvailable(ctx, args.slug, args.id);

    const { id, slug, status, description, website, phone, email, seo, ...rest } = args;
    const now = Date.now();
    const current = withoutSystemFields(existing);
    const next = {
      ...current,
      ...rest,
      publishing: {
        slug,
        status,
        updatedAt: now,
        publishedAt: status === "published" ? (existing.publishing.publishedAt ?? now) : existing.publishing.publishedAt,
      },
    };
    if (description) next.description = description;
    else delete next.description;
    if (website) next.website = website;
    else delete next.website;
    if (phone) next.phone = phone;
    else delete next.phone;
    if (email) next.email = email;
    else delete next.email;
    if (seo) next.seo = seo;
    else delete next.seo;
    await ctx.db.replace(id, next);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "developers", action: "update", targetId: id });
  },
});

export const setPublishingStatus = mutation({
  args: {
    id: v.id("developers"),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "developers", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Developer not found");
    }

    if (existing.publishing.status === args.status) {
      return null;
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      publishing: {
        ...existing.publishing,
        status: args.status,
        updatedAt: now,
        publishedAt: args.status === "published" ? (existing.publishing.publishedAt ?? now) : existing.publishing.publishedAt,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "developers", action: "update", targetId: args.id });
    return null;
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("developers")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, "developers", "update");
    const existing = await ctx.db.query("developers").collect();
    const existingIds = new Set(existing.map((developer) => developer._id));
    const uniqueIds = new Set(args.orderedIds);
    if (
      uniqueIds.size !== existing.length ||
      args.orderedIds.length !== existing.length ||
      !args.orderedIds.every((id) => existingIds.has(id))
    ) {
      throw new Error("orderedIds must be exactly the set of developers");
    }
    for (const [index, id] of args.orderedIds.entries()) {
      await ctx.db.patch(id, { rank: index });
    }
    return null;
  },
});

function withoutSystemFields<T extends { _id: Id<"developers">; _creationTime: number }>(doc: T): Omit<T, "_id" | "_creationTime"> {
  const { _id, _creationTime, ...fields } = doc;
  if (!_id || !_creationTime) {
    throw new Error("Developer document is missing system fields");
  }
  return fields;
}

export const remove = mutation({
  args: { id: v.id("developers") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "developers", "delete");
    await assertNotReferenced(ctx, args.id);
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "developers", action: "delete", targetId: args.id });
  },
});
