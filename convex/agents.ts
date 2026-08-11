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

    const { slug, status, ...rest } = args;
    const now = Date.now();
    const id = await ctx.db.insert("agents", {
      ...rest,
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
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "agents", action: "update", targetId: id });
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
