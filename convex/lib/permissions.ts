import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { can, type Action, type Resource } from "./roles";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ForbiddenError("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) {
    throw new ForbiddenError("No user record for this identity");
  }
  return user;
}

export async function requireRole(ctx: QueryCtx | MutationCtx, resource: Resource, action: Action) {
  const user = await getCurrentUser(ctx);
  if (!can(user.role, resource, action)) {
    throw new ForbiddenError(`Role "${user.role}" cannot "${action}" on "${resource}"`);
  }
  // Super Admin-configured, per-account runtime override (see
  // convex/users.ts `updateResourceAccess`) — lives on the actor's own
  // row, so this never needs an extra read. Only ever narrows the
  // "admin" role for that one account; never super_admin/agent/client.
  if (user.role === "admin" && user.disabledResources?.includes(resource)) {
    throw new ForbiddenError(`Access to "${resource}" has been disabled for your Admin account by a Super Admin`);
  }
  return user;
}

// Row-level ownership guard for the handful of resources (Properties,
// Projects, Blog Posts) where a regular Admin may only see/modify entries
// they personally created — Super Admin is exempt and always passes. This
// sits on top of `requireRole`'s role-level grant the same way
// `properties.ts`'s Agent-scoping (`assertCanUpdate`) does; it can't be
// expressed by the flat `PERMISSION_MATRIX` because that grid has no
// concept of "which row".
export function assertOwnsIfAdmin(actor: { _id: Id<"users">; role: string }, ownerId: Id<"users">, message: string) {
  if (actor.role === "admin" && ownerId !== actor._id) {
    throw new ForbiddenError(message);
  }
}

// Companion to `assertOwnsIfAdmin` for queries: an Admin querying a
// specific row they don't own should see it as absent (`null`), not throw
// — indistinguishable from a genuinely deleted/nonexistent row, consistent
// with it being fully hidden from their `list` results too.
export function isHiddenFromAdmin(actor: { role: string; _id: Id<"users"> }, ownerId: Id<"users">) {
  return actor.role === "admin" && ownerId !== actor._id;
}
