import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole, ForbiddenError } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";

const statusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("closed"),
);

async function assertCanUpdate(
  ctx: MutationCtx,
  actor: { _id: Id<"users">; role: string },
  existing: { assignedAgentId?: Id<"agents"> },
) {
  if (actor.role !== "agent") {
    return;
  }
  const agentProfile = await ctx.db
    .query("agents")
    .withIndex("by_user", (q) => q.eq("userId", actor._id))
    .unique();
  if (!agentProfile || existing.assignedAgentId !== agentProfile._id) {
    throw new ForbiddenError("Agents can only update their own assigned leads");
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "leads", "read");
    return await ctx.db.query("leads").collect();
  },
});

export const get = query({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "leads", "read");
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("leads"),
    status: statusValidator,
    assignedAgentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "leads", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Lead not found");
    }
    await assertCanUpdate(ctx, actor, existing);
    await ctx.db.patch(args.id, {
      status: args.status,
      assignedAgentId: args.assignedAgentId,
    });
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "leads",
      action: "update",
      targetId: args.id,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "leads", "delete");
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "leads",
      action: "delete",
      targetId: args.id,
    });
  },
});
