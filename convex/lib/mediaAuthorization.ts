import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireRole, getCurrentUser, ForbiddenError } from "./permissions";
import { can, type Action } from "./roles";
import { MEDIA_ACCESS_CONFIG } from "./mediaAccessConfig";
import type { MediaEntityType } from "./mediaEntityType";

type WriteAction = Extract<Action, "create" | "update" | "delete">;

// Called by every write path in convex/mediaItems.ts before touching the
// database. Two layers: (1) does this role have this action on the
// "mediaItems" resource at all (the flat matrix, Phase 1); (2) for a
// Client specifically, is this a propertySubmission they own, and — while
// mutating — is it still "pending" (once Admin/Agent review starts, a
// Client can no longer add/remove documents on it).
export async function assertCanWriteMedia(
  ctx: MutationCtx | QueryCtx,
  action: WriteAction,
  entityType: MediaEntityType,
  entityId: string,
) {
  const user = await requireRole(ctx, "mediaItems", action);
  if (user.role !== "client") {
    // Admin/Super Admin/Agent: the flat matrix's blanket grant is
    // sufficient — no additional per-entity ownership scoping in this
    // phase (mirrors the rest of the mediaItems matrix's existing design).
    return user;
  }

  if (entityType !== "propertySubmission") {
    throw new ForbiddenError("Clients may only attach media to their own property submissions");
  }
  const submission = await ctx.db.get(entityId as Id<"propertySubmissions">);
  if (!submission || submission.clientId !== user._id) {
    throw new ForbiddenError("Not your submission");
  }
  if (submission.status !== "pending") {
    throw new ForbiddenError("This submission's documents can no longer be changed");
  }
  return user;
}

// Called by convex/mediaItems.ts's listByEntity and getForPrivateDelivery.
// Public entity types (property/project/etc.) are open to anyone, including
// unauthenticated visitors — this is what lets Phase 5's public property
// pages render images without requiring sign-in. Private (propertySubmission)
// requires the caller to be the owning Client or staff (Admin/Agent/Super Admin).
export async function assertCanReadMedia(ctx: QueryCtx | MutationCtx, entityType: MediaEntityType, entityId: string) {
  if (MEDIA_ACCESS_CONFIG[entityType].access === "public") {
    return;
  }

  const user = await getCurrentUser(ctx);
  if (user.role !== "client") {
    if (!can(user.role, "mediaItems", "read")) {
      throw new ForbiddenError(`Role "${user.role}" cannot read mediaItems`);
    }
    return;
  }
  const submission = await ctx.db.get(entityId as Id<"propertySubmissions">);
  if (!submission || submission.clientId !== user._id) {
    throw new ForbiddenError("Not your submission");
  }
}
