import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";

const statusValidator = v.union(v.literal("draft"), v.literal("published"), v.literal("archived"));

async function assertSlugAvailable(ctx: MutationCtx, slug: string, excludeId?: Id<"agents">) {
  const existing = await ctx.db
    .query("agents")
    .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

function withoutSystemFields<T extends { _id: Id<"agents">; _creationTime: number }>(doc: T): Omit<T, "_id" | "_creationTime"> {
  const { _id, _creationTime, ...fields } = doc;
  if (!_id || !_creationTime) {
    throw new Error("Agent document is missing system fields");
  }
  return fields;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "agents", "read");
    return await ctx.db.query("agents").collect();
  },
});

export const get = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "agents", "read");
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    position: v.optional(v.string()),
    bio: v.optional(localizedTextValidator),
    email: v.string(),
    phone: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    seo: v.optional(seoFieldsValidator),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "agents", "create");
    await assertSlugAvailable(ctx, args.slug);

    const { slug, status, position, ...rest } = args;
    const now = Date.now();
    const id = await ctx.db.insert("agents", {
      ...rest,
      ...(position ? { position } : {}),
      publishing: {
        slug,
        status,
        updatedAt: now,
        publishedAt: status === "published" ? now : undefined,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "agents", action: "create", targetId: id });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("agents"),
    name: v.string(),
    position: v.optional(v.string()),
    bio: v.optional(localizedTextValidator),
    email: v.string(),
    phone: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    seo: v.optional(seoFieldsValidator),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "agents", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Agent not found");
    }
    await assertSlugAvailable(ctx, args.slug, args.id);

    const { id, slug, status, bio, phone, seo, userId, position, ...rest } = args;
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
    if (userId) next.userId = userId;
    else if (existing.userId) next.userId = existing.userId;
    else delete next.userId;
    if (position) next.position = position;
    else delete next.position;
    if (bio) next.bio = bio;
    else delete next.bio;
    if (phone) next.phone = phone;
    else delete next.phone;
    if (seo) next.seo = seo;
    else delete next.seo;
    await ctx.db.replace(id, next);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "agents", action: "update", targetId: id });
  },
});

export const setPublishingStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "agents", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Agent not found");
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
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "agents", action: "update", targetId: args.id });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "agents", "delete");
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "agents", action: "delete", targetId: args.id });
  },
});
