import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { buildInvitationRequestBody } from "./lib/agentInvitation";

// Runs BEFORE the action below ever calls Clerk's API — an unauthorized
// caller never reaches the external request at all, since this throws
// first. requireRole needs ctx.db, so this has to be a mutation the action
// delegates to, not inline logic inside the action itself.
export const authorizeAndLogInvite = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "users", "create");
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "users",
      action: "invite_agent",
      targetId: args.email,
    });
  },
});

export const inviteAgent = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.agentInvitations.authorizeAndLogInvite, { email: args.email });

    const response = await fetch("https://api.clerk.com/v1/invitations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildInvitationRequestBody(args.email)),
    });
    if (!response.ok) {
      throw new Error(`Clerk invitation request failed: ${response.status} ${await response.text()}`);
    }
    return await response.json();
  },
});
