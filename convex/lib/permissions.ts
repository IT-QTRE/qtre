import type { MutationCtx, QueryCtx } from "../_generated/server";
import { can, type Action, type Resource } from "./roles";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
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
  return user;
}
