import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole, ForbiddenError, assertOwnsIfAdmin, isHiddenFromAdmin } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";
import { propertySharedFactsValidator } from "./lib/propertyFacts";
import { furnishingValidator, propertyTypeValidator, rentalPeriodValidator } from "./lib/propertyAttributes";

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
  address: v.optional(v.string()),
  placeId: v.optional(v.string()),
  listingStatus: listingStatusValidator,
  propertyType: v.optional(propertyTypeValidator),
  furnishing: v.optional(furnishingValidator),
  rentalPeriod: v.optional(rentalPeriodValidator),
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

    const { slug, status, propertyType, furnishing, rentalPeriod, ...rest } = args;
    const now = Date.now();
    const id = await ctx.db.insert("properties", {
      ...rest,
      ...(propertyType ? { propertyType } : {}),
      ...(furnishing ? { furnishing } : {}),
      ...(rest.listingStatus === "for_rent" && rentalPeriod ? { rentalPeriod } : {}),
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

    const { id, slug, status, communityId, developerId, projectId, agentId, address, placeId, coordinates, propertyType, furnishing, rentalPeriod, ...rest } = args;
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
    if (communityId) next.communityId = communityId;
    else delete next.communityId;
    if (developerId) next.developerId = developerId;
    else delete next.developerId;
    if (projectId) next.projectId = projectId;
    else delete next.projectId;
    if (agentId) next.agentId = agentId;
    else delete next.agentId;
    if (address) next.address = address;
    else delete next.address;
    if (placeId) next.placeId = placeId;
    else delete next.placeId;
    if (coordinates) next.coordinates = coordinates;
    else delete next.coordinates;
    if (propertyType) next.propertyType = propertyType;
    else delete next.propertyType;
    if (furnishing) next.furnishing = furnishing;
    else delete next.furnishing;
    if (rest.listingStatus === "for_rent" && rentalPeriod) next.rentalPeriod = rentalPeriod;
    else delete next.rentalPeriod;
    await ctx.db.replace(id, next);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "properties", action: "update", targetId: id });
  },
});

export const setPublishingStatus = mutation({
  args: {
    id: v.id("properties"),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "properties", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Property not found");
    }
    await assertCanUpdate(ctx, actor, existing);
    assertOwnsIfAdmin(actor, existing.createdBy, "Admins can only update properties they created");

    if (existing.publishing.status === args.status) {
      return null;
    }

    const now = Date.now();
    const current = withoutSystemFields(existing);
    await ctx.db.replace(args.id, {
      ...current,
      publishing: {
        ...existing.publishing,
        status: args.status,
        updatedAt: now,
        publishedAt: args.status === "published" ? (existing.publishing.publishedAt ?? now) : existing.publishing.publishedAt,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "properties", action: "update", targetId: args.id });
    return null;
  },
});

function withoutSystemFields<T extends { _id: Id<"properties">; _creationTime: number }>(doc: T): Omit<T, "_id" | "_creationTime"> {
  const { _id, _creationTime, ...fields } = doc;
  if (!_id || !_creationTime) {
    throw new Error("Property document is missing system fields");
  }
  return fields;
}

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
