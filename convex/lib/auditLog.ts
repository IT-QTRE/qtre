import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { Resource } from "./roles";

export async function writeAuditLog(
  ctx: MutationCtx,
  args: {
    actorUserId: Id<"users">;
    resource: Resource;
    action: string;
    targetId?: string;
    details?: string;
  },
) {
  await ctx.db.insert("auditLogs", {
    actorUserId: args.actorUserId,
    resource: args.resource,
    action: args.action,
    targetId: args.targetId,
    details: args.details,
    createdAt: Date.now(),
  });
}
