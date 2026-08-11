import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { RESOURCES } from "./lib/roles";

const resourceValidator = v.union(...RESOURCES.map((r) => v.literal(r)));

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    resource: v.optional(resourceValidator),
    actorUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "auditLogs", "read");

    if (args.resource !== undefined) {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_resource", (q) => q.eq("resource", args.resource!))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    if (args.actorUserId !== undefined) {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actorUserId", args.actorUserId!))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("auditLogs")
      .withIndex("by_created_at")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
