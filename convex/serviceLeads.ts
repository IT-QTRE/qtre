import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { serviceLeadStatusValidator } from "./lib/serviceDesks";

async function assertAssignableAdmin(ctx: { db: { get: (id: Id<"users">) => Promise<{ role: string } | null> } }, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    throw new Error("Can only assign to an Admin");
  }
}

function withoutSystemFields<T extends { _id: Id<"serviceLeads">; _creationTime: number }>(
  doc: T,
): Omit<T, "_id" | "_creationTime"> {
  const { _id: _dropId, _creationTime: _dropCreated, ...rest } = doc;
  return rest;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "serviceLeads", "read");
    return await ctx.db.query("serviceLeads").collect();
  },
});

const NEW_COUNT_CAP = 99;

export const newCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireRole(ctx, "serviceLeads", "read");
    const newest = await ctx.db
      .query("serviceLeads")
      .withIndex("by_status", (q) => q.eq("status", "new"))
      .take(NEW_COUNT_CAP);
    return newest.length;
  },
});

export const get = query({
  args: { id: v.id("serviceLeads") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "serviceLeads", "read");
    return await ctx.db.get(args.id);
  },
});

export const listAssignees = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
    }),
  ),
  handler: async (ctx) => {
    await requireRole(ctx, "serviceLeads", "read");
    const users = await ctx.db.query("users").collect();
    return users
      .filter((user) => user.role === "admin" || user.role === "super_admin")
      .map((user) => ({ _id: user._id, name: user.name, email: user.email }));
  },
});

export const update = mutation({
  args: {
    id: v.id("serviceLeads"),
    status: serviceLeadStatusValidator,
    assignedUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "serviceLeads", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Inquiry not found");
    }
    if (args.assignedUserId) {
      await assertAssignableAdmin(ctx, args.assignedUserId);
    }
    const next = withoutSystemFields(existing);
    next.status = args.status;
    if (args.assignedUserId) next.assignedUserId = args.assignedUserId;
    else delete next.assignedUserId;
    await ctx.db.replace(args.id, next);
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "serviceLeads",
      action: "update",
      targetId: args.id,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("serviceLeads") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "serviceLeads", "delete");
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "serviceLeads",
      action: "delete",
      targetId: args.id,
    });
  },
});
