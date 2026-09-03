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

const PUBLISHED_SLUG_SCAN = 500;

// Slug uniqueness is per-country for drafts (two markets may share "downtown").
// The public URL is `/communities/{slug}` with no country, so a live slug is
// unique across published communities in every market.
async function assertSlugAvailable(ctx: MutationCtx, countryCode: string, slug: string, excludeId?: Id<"communities">) {
  const existing = await ctx.db
    .query("communities")
    .withIndex("by_country_and_slug", (q) => q.eq("countryCode", countryCode).eq("publishing.slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use in ${countryCode}`);
  }
}

async function assertPublishedSlugAvailable(ctx: MutationCtx, slug: string, excludeId?: Id<"communities">) {
  const published = await ctx.db
    .query("communities")
    .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
    .take(PUBLISHED_SLUG_SCAN);
  const clash = published.find((community) => community.publishing.slug === slug && community._id !== excludeId);
  if (clash) {
    throw new Error(`Slug "${slug}" is already live in ${clash.countryCode}`);
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

export const listLinkCounts = query({
  args: {},
  returns: v.array(
    v.object({
      communityId: v.id("communities"),
      properties: v.number(),
      projects: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireRole(ctx, "communities", "read");
    const communities = await ctx.db.query("communities").collect();
    return await Promise.all(
      communities.map(async (community) => {
        const [projects, properties] = await Promise.all([
          ctx.db
            .query("projects")
            .withIndex("by_community", (q) => q.eq("communityId", community._id))
            .collect(),
          ctx.db
            .query("properties")
            .withIndex("by_community", (q) => q.eq("communityId", community._id))
            .collect(),
        ]);
        return {
          communityId: community._id,
          properties: properties.length,
          projects: projects.length,
        };
      }),
    );
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
    if (args.status === "published") {
      await assertPublishedSlugAvailable(ctx, args.slug);
    }

    const { slug, status, ...rest } = args;
    const now = Date.now();
    const rank = await nextCatalogRank(ctx, "communities");
    const id = await ctx.db.insert("communities", {
      ...rest,
      ...(rank != null ? { rank } : {}),
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
    if (args.status === "published") {
      await assertPublishedSlugAvailable(ctx, args.slug, args.id);
    }

    const { id, slug, status, description, seo, ...rest } = args;
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
    if (seo) next.seo = seo;
    else delete next.seo;
    await ctx.db.replace(id, next);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "communities", action: "update", targetId: id });
  },
});

export const setPublishingStatus = mutation({
  args: {
    id: v.id("communities"),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "communities", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Community not found");
    }

    if (existing.publishing.status === args.status) {
      return null;
    }
    if (args.status === "published") {
      await assertPublishedSlugAvailable(ctx, existing.publishing.slug, args.id);
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
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "communities", action: "update", targetId: args.id });
    return null;
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("communities")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, "communities", "update");
    const existing = await ctx.db.query("communities").collect();
    const existingIds = new Set(existing.map((community) => community._id));
    const uniqueIds = new Set(args.orderedIds);
    if (
      uniqueIds.size !== existing.length ||
      args.orderedIds.length !== existing.length ||
      !args.orderedIds.every((id) => existingIds.has(id))
    ) {
      throw new Error("orderedIds must be exactly the set of communities");
    }
    for (const [index, id] of args.orderedIds.entries()) {
      await ctx.db.patch(id, { rank: index });
    }
    return null;
  },
});

function withoutSystemFields<T extends { _id: Id<"communities">; _creationTime: number }>(doc: T): Omit<T, "_id" | "_creationTime"> {
  const { _id, _creationTime, ...fields } = doc;
  if (!_id || !_creationTime) {
    throw new Error("Community document is missing system fields");
  }
  return fields;
}

export const remove = mutation({
  args: { id: v.id("communities") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "communities", "delete");
    await assertNotReferenced(ctx, args.id);
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "communities", action: "delete", targetId: args.id });
  },
});
