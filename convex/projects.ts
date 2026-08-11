import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole, assertOwnsIfAdmin, isHiddenFromAdmin } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";

const publishingStatusValidator = v.union(v.literal("draft"), v.literal("published"), v.literal("archived"));
const projectStatusValidator = v.union(
  v.literal("upcoming"),
  v.literal("under_construction"),
  v.literal("completed"),
);

// Global uniqueness (like Developers/Agents), not per-country like
// Communities — nothing in the schema scopes a project's slug by country.
async function assertSlugAvailable(ctx: MutationCtx, slug: string, excludeId?: Id<"projects">) {
  const existing = await ctx.db
    .query("projects")
    .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

// Referential-integrity guard: a project deleted out from under a still-live
// property would leave that property's `projectId` dangling. Properties are
// the only table that can reference a project by id (see `by_project`).
async function assertNotReferenced(ctx: MutationCtx, projectId: Id<"projects">) {
  const referencingProperty = await ctx.db
    .query("properties")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .first();
  if (referencingProperty) {
    throw new Error("Cannot delete a project that still has properties referencing it");
  }
}

const mutationArgs = {
  title: localizedTextValidator,
  description: localizedTextValidator,
  developerId: v.id("developers"),
  communityId: v.optional(v.id("communities")),
  countryCode: v.string(),
  city: localizedTextValidator,
  status: projectStatusValidator,
  startingPrice: v.optional(v.number()),
  coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  amenities: v.optional(v.array(v.string())),
  paymentPlan: v.optional(
    v.array(v.object({ label: v.string(), percentage: v.number(), note: v.optional(v.string()) })),
  ),
  seo: v.optional(seoFieldsValidator),
  slug: v.string(),
  publishingStatus: publishingStatusValidator,
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const actor = await requireRole(ctx, "projects", "read");
    if (actor.role === "admin") {
      return await ctx.db
        .query("projects")
        .withIndex("by_created_by", (q) => q.eq("createdBy", actor._id))
        .collect();
    }
    return await ctx.db.query("projects").collect();
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "projects", "read");
    const project = await ctx.db.get(args.id);
    if (!project || isHiddenFromAdmin(actor, project.createdBy)) {
      return null;
    }
    return project;
  },
});

// Minimal, unrestricted-by-owner lookups for surfaces that must resolve a
// project's name across Admins even though the full row is Admin-scoped —
// the Leads table/detail view, and the Property form's "Project" picker
// (a property can legitimately belong to a project another Admin created).
// Exposes only `_id` + display title, never the full document.
export const listNames = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "projects", "read");
    const projects = await ctx.db.query("projects").collect();
    return projects.map((project) => ({ _id: project._id, title: project.title.en }));
  },
});

export const getName = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "projects", "read");
    const project = await ctx.db.get(args.id);
    return project ? { _id: project._id, title: project.title.en } : null;
  },
});

export const create = mutation({
  args: mutationArgs,
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "projects", "create");
    await assertSlugAvailable(ctx, args.slug);

    const { slug, publishingStatus, ...rest } = args;
    const now = Date.now();
    const id = await ctx.db.insert("projects", {
      ...rest,
      createdBy: actor._id,
      publishing: {
        slug,
        status: publishingStatus,
        updatedAt: now,
        publishedAt: publishingStatus === "published" ? now : undefined,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "projects", action: "create", targetId: id });
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("projects"), ...mutationArgs },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "projects", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Project not found");
    }
    assertOwnsIfAdmin(actor, existing.createdBy, "Admins can only update projects they created");
    await assertSlugAvailable(ctx, args.slug, args.id);

    const { id, slug, publishingStatus, ...rest } = args;
    const now = Date.now();
    await ctx.db.patch(id, {
      ...rest,
      publishing: {
        slug,
        status: publishingStatus,
        updatedAt: now,
        publishedAt: publishingStatus === "published" ? (existing.publishing.publishedAt ?? now) : existing.publishing.publishedAt,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "projects", action: "update", targetId: id });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "projects", "delete");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Project not found");
    }
    assertOwnsIfAdmin(actor, existing.createdBy, "Admins can only delete projects they created");
    await assertNotReferenced(ctx, args.id);
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "projects", action: "delete", targetId: args.id });
  },
});
