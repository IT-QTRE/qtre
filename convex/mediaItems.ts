import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { mediaEntityTypeValidator, type MediaEntityType } from "./lib/mediaEntityType";
import { localizedTextValidator } from "./lib/localizedText";
import { assertCanWriteMedia, assertCanReadMedia } from "./lib/mediaAuthorization";
import { MEDIA_ACCESS_CONFIG, requiredPathnamePrefix } from "./lib/mediaAccessConfig";
import { ForbiddenError, requireRole } from "./lib/permissions";

// Entity types whose media must never appear in the Media Library browse
// query — derived from MEDIA_ACCESS_CONFIG so a future private type is
// excluded automatically without editing this list.
const NON_PUBLIC_ENTITY_TYPES = (Object.keys(MEDIA_ACCESS_CONFIG) as MediaEntityType[]).filter(
  (type) => MEDIA_ACCESS_CONFIG[type].access !== "public",
);

async function publicEntityLabel(
  ctx: QueryCtx,
  entityType: MediaEntityType,
  entityId: string,
): Promise<string | null> {
  switch (entityType) {
    case "property": {
      const id = ctx.db.normalizeId("properties", entityId);
      if (!id) return null;
      const doc = await ctx.db.get(id);
      return doc?.title.en || null;
    }
    case "project": {
      const id = ctx.db.normalizeId("projects", entityId);
      if (!id) return null;
      const doc = await ctx.db.get(id);
      return doc?.title.en || null;
    }
    case "developer": {
      const id = ctx.db.normalizeId("developers", entityId);
      if (!id) return null;
      const doc = await ctx.db.get(id);
      return doc?.name.en || null;
    }
    case "agent": {
      const id = ctx.db.normalizeId("agents", entityId);
      if (!id) return null;
      const doc = await ctx.db.get(id);
      return doc?.name || null;
    }
    case "community": {
      const id = ctx.db.normalizeId("communities", entityId);
      if (!id) return null;
      const doc = await ctx.db.get(id);
      return doc?.name.en || null;
    }
    case "blogPost": {
      const id = ctx.db.normalizeId("blogPosts", entityId);
      if (!id) return null;
      const doc = await ctx.db.get(id);
      return doc?.title.en || null;
    }
    default:
      return null;
  }
}

async function withPublicEntityLabels(ctx: QueryCtx, page: Doc<"mediaItems">[]) {
  return await Promise.all(
    page.map(async (item) => ({
      ...item,
      entityLabel: await publicEntityLabel(ctx, item.entityType, item.entityId),
    })),
  );
}

// Called by app/api/blob/upload/route.ts's onBeforeGenerateToken before it
// ever asks Vercel Blob for a token — an unauthorized caller's upload is
// rejected before a single byte is transferred. Read-only (a query, not a
// mutation): it either returns null or throws, no state changes.
export const checkUploadAuthorization = query({
  args: { entityType: mediaEntityTypeValidator, entityId: v.string() },
  handler: async (ctx, args) => {
    await assertCanWriteMedia(ctx, "create", args.entityType, args.entityId);
    return null;
  },
});

export const create = mutation({
  args: {
    entityType: mediaEntityTypeValidator,
    entityId: v.string(),
    url: v.string(),
    pathname: v.string(),
    mimeType: v.string(),
    alt: v.optional(localizedTextValidator),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertCanWriteMedia(ctx, "create", args.entityType, args.entityId);

    // Without this, `pathname` is just a caller-supplied string — nothing
    // else ties it to the entity the caller was just authorized against.
    // A caller authorized for their own entityId could otherwise pass the
    // (leaked/guessed) pathname of a DIFFERENT entity's private document and
    // read/delete it via this app's own "authorized" routes. Binding
    // entityId into the required prefix makes that substitution impossible.
    if (!args.pathname.startsWith(requiredPathnamePrefix(args.entityType, args.entityId))) {
      throw new ForbiddenError("Pathname does not belong to this entity.");
    }

    const last = await ctx.db
      .query("mediaItems")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .order("desc")
      .first();
    const { order: requestedOrder, ...fields } = args;
    const order = requestedOrder ?? (last ? last.order + 1 : 0);

    return await ctx.db.insert("mediaItems", { ...fields, order });
  },
});

export const listByEntity = query({
  args: { entityType: mediaEntityTypeValidator, entityId: v.string() },
  handler: async (ctx, args) => {
    await assertCanReadMedia(ctx, args.entityType, args.entityId);
    return await ctx.db
      .query("mediaItems")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .take(200);
  },
});

// Called by admin list-table columns (property/project/developer/agent/
// community) to render a small thumbnail per row without one query per row
// — a single call given the whole page's ids returns a map keyed by
// entityId. The `by_entity` index sorts by `order` ascending, so `.first()`
// is each entity's lowest-`order` (leftmost-shown-in-the-uploader) item.
// Restricted to public entity types — propertySubmission's private
// documents have no business appearing as a browsable-table thumbnail, and
// every current caller only ever passes a public entityType anyway.
export const listPrimaryByEntityIds = query({
  args: { entityType: mediaEntityTypeValidator, entityIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (MEDIA_ACCESS_CONFIG[args.entityType].access !== "public") {
      throw new ForbiddenError("listPrimaryByEntityIds only serves public entity types");
    }
    const entries = await Promise.all(
      args.entityIds.map(async (entityId) => {
        const item = await ctx.db
          .query("mediaItems")
          .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", entityId))
          .first();
        return [entityId, item ? { url: item.url, mimeType: item.mimeType } : null] as const;
      }),
    );
    return Object.fromEntries(entries);
  },
});

export const reorder = mutation({
  args: {
    entityType: mediaEntityTypeValidator,
    entityId: v.string(),
    orderedIds: v.array(v.id("mediaItems")),
  },
  handler: async (ctx, args) => {
    await assertCanWriteMedia(ctx, "update", args.entityType, args.entityId);

    const existing = await ctx.db
      .query("mediaItems")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .take(200);
    const existingIds = new Set(existing.map((item) => item._id));
    if (args.orderedIds.length !== existing.length || !args.orderedIds.every((id) => existingIds.has(id))) {
      throw new Error("orderedIds must be exactly the set of media items belonging to this entity");
    }

    for (const [index, id] of args.orderedIds.entries()) {
      await ctx.db.patch(id, { order: index });
    }
    return null;
  },
});

// Called by lib/actions/media.ts's Server Action, step 1 (before
// deleteRecord/del()). Returns just enough for the action to call Blob's
// del() with the right store — never trusts this alone to actually delete
// anything; deleteRecord below re-runs the same authorization check
// independently. Returns null (rather than throwing) if the item is
// already gone — mirrors deleteRecord's own no-op-on-missing behavior, so
// a double-click on "Remove" (or a stale UI list that hasn't yet caught up
// with an earlier delete) is a harmless no-op instead of a hard error.
export const getForDelete = query({
  args: { mediaItemId: v.id("mediaItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.mediaItemId);
    if (!item) {
      return null;
    }
    await assertCanWriteMedia(ctx, "delete", item.entityType, item.entityId);
    return { pathname: item.pathname, access: MEDIA_ACCESS_CONFIG[item.entityType].access };
  },
});

// Called by lib/actions/media.ts's Server Action, step 2 (before del()).
// Independently re-checks authorization rather than trusting getForDelete's
// earlier check — see Global Constraints.
export const deleteRecord = mutation({
  args: { mediaItemId: v.id("mediaItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.mediaItemId);
    if (!item) {
      return null;
    }
    await assertCanWriteMedia(ctx, "delete", item.entityType, item.entityId);
    await ctx.db.delete(args.mediaItemId);
    return null;
  },
});

// Called by app/api/blob/private/route.ts for every private-blob view.
export const getForPrivateDelivery = query({
  args: { mediaItemId: v.id("mediaItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.mediaItemId);
    if (!item) {
      throw new ForbiddenError("Not found");
    }
    // This route exists solely to serve PRIVATE blobs through an
    // authenticated proxy. Public-entity media has no business going
    // through it — refusing here means a bug elsewhere that calls this
    // query for a public mediaItem fails loudly instead of "working" and
    // masking the mistake.
    if (MEDIA_ACCESS_CONFIG[item.entityType].access !== "private") {
      throw new ForbiddenError("This media item is not private");
    }
    await assertCanReadMedia(ctx, item.entityType, item.entityId);
    return { pathname: item.pathname, mimeType: item.mimeType };
  },
});

// Media Library browse endpoint — filterable grid over public entity types
// only. Unlike listByEntity/getForDelete/etc., this has no per-row
// ownership check: it only gates on mediaItems:read. Agent and client both
// hold that permission (for their own per-entity flows), so this query
// MUST never return private-access rows under any argument combination —
// not even when entityType is omitted ("All"). See MEDIA_ACCESS_CONFIG.
export const listAllPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    entityType: v.optional(mediaEntityTypeValidator),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "mediaItems", "read");

    if (args.entityType !== undefined) {
      if (MEDIA_ACCESS_CONFIG[args.entityType].access !== "public") {
        throw new ForbiddenError("listAllPaginated only serves public entity types");
      }
      const result = await ctx.db
        .query("mediaItems")
        .withIndex("by_entity", (q) => q.eq("entityType", args.entityType!))
        .order("desc")
        .paginate(args.paginationOpts);
      return { ...result, page: await withPublicEntityLabels(ctx, result.page) };
    }

    // "All" still excludes every non-public entityType. Do NOT remove this
    // filter just because the UI never asks for propertySubmission — agents
    // and clients can call this query directly with mediaItems:read and
    // would otherwise receive private submission documents (title deeds,
    // floor plans) that belong to other clients.
    const result = await ctx.db
      .query("mediaItems")
      .withIndex("by_entity")
      .order("desc")
      .filter((q) => q.and(...NON_PUBLIC_ENTITY_TYPES.map((t) => q.neq(q.field("entityType"), t))))
      .paginate(args.paginationOpts);
    return { ...result, page: await withPublicEntityLabels(ctx, result.page) };
  },
});
