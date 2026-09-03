import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole, assertOwnsIfAdmin, isHiddenFromAdmin } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";
import { assertRelatedValid, relatedValidator } from "./lib/blogRelated";
import { categoryIdFromTopicName } from "./lib/blogCategory";

const statusValidator = v.union(v.literal("draft"), v.literal("published"), v.literal("archived"));

// Convex has no unique-index constraint, so slug uniqueness is enforced
// here in the mutation instead. Blog posts check this globally
// (via `by_publishing_slug`), same as Developers/Agents.
async function assertSlugAvailable(ctx: MutationCtx, slug: string, excludeId?: Id<"blogPosts">) {
  const existing = await ctx.db
    .query("blogPosts")
    .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const actor = await requireRole(ctx, "blogPosts", "read");
    if (actor.role === "admin") {
      return await ctx.db
        .query("blogPosts")
        .withIndex("by_author", (q) => q.eq("authorUserId", actor._id))
        .collect();
    }
    return await ctx.db.query("blogPosts").collect();
  },
});

export const get = query({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "blogPosts", "read");
    const post = await ctx.db.get(args.id);
    if (!post || isHiddenFromAdmin(actor, post.authorUserId)) {
      return null;
    }
    return post;
  },
});

export const create = mutation({
  args: {
    title: localizedTextValidator,
    body: localizedTextValidator,
    seo: v.optional(seoFieldsValidator),
    related: v.optional(relatedValidator),
    topicName: v.optional(v.string()),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "blogPosts", "create");
    await assertSlugAvailable(ctx, args.slug);
    await assertRelatedValid(ctx, args.related);

    const { slug, status, related, topicName, ...rest } = args;
    const categoryId = await categoryIdFromTopicName(ctx, topicName);
    const now = Date.now();
    const id = await ctx.db.insert("blogPosts", {
      ...rest,
      authorUserId: actor._id,
      ...(related && related.length > 0 ? { related } : {}),
      ...(categoryId ? { categoryId } : {}),
      publishing: {
        slug,
        status,
        updatedAt: now,
        publishedAt: status === "published" ? now : undefined,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "blogPosts", action: "create", targetId: id });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("blogPosts"),
    title: localizedTextValidator,
    body: localizedTextValidator,
    seo: v.optional(seoFieldsValidator),
    related: v.optional(relatedValidator),
    topicName: v.optional(v.string()),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "blogPosts", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Blog post not found");
    }
    assertOwnsIfAdmin(actor, existing.authorUserId, "Admins can only update blog posts they created");
    await assertSlugAvailable(ctx, args.slug, args.id);
    await assertRelatedValid(ctx, args.related, args.id);

    const { id, slug, status, seo, related, topicName, ...rest } = args;
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
    if (seo) next.seo = seo;
    else delete next.seo;
    if (related && related.length > 0) next.related = related;
    else delete next.related;
    if (topicName !== undefined) {
      const categoryId = await categoryIdFromTopicName(ctx, topicName);
      if (categoryId) next.categoryId = categoryId;
      else delete next.categoryId;
    }
    await ctx.db.replace(id, next);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "blogPosts", action: "update", targetId: id });
  },
});

export const setPublishingStatus = mutation({
  args: {
    id: v.id("blogPosts"),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "blogPosts", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Blog post not found");
    }
    assertOwnsIfAdmin(actor, existing.authorUserId, "Admins can only update blog posts they created");

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
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "blogPosts", action: "update", targetId: args.id });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "blogPosts", "delete");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Blog post not found");
    }
    assertOwnsIfAdmin(actor, existing.authorUserId, "Admins can only delete blog posts they created");
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "blogPosts", action: "delete", targetId: args.id });
  },
});

function withoutSystemFields<T extends { _id: Id<"blogPosts">; _creationTime: number }>(
  doc: T,
): Omit<T, "_id" | "_creationTime"> {
  const { _id, _creationTime, ...fields } = doc;
  if (!_id || !_creationTime) {
    throw new Error("Blog post document is missing system fields");
  }
  return fields;
}
