/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

describe("agentInvitations.authorizeAndLogInvite", () => {
  test("rejects a caller without users:create permission", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|agent-1",
        email: "agent1@example.com",
        name: "Agent One",
        role: "agent",
        createdAt: Date.now(),
      });
    });
    const asAgent = t.withIdentity({ tokenIdentifier: "clerk|agent-1" });
    await expect(
      asAgent.mutation(internal.agentInvitations.authorizeAndLogInvite, {
        email: "newagent@example.com",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("allows an Admin and writes an audit log entry", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin1@example.com",
        name: "Admin One",
        role: "admin",
        createdAt: Date.now(),
      });
    });
    const asAdmin = t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
    await asAdmin.mutation(internal.agentInvitations.authorizeAndLogInvite, {
      email: "newagent@example.com",
    });

    const logs = await t.run(async (ctx) => {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actorUserId", adminId))
        .collect();
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: "invite_agent", targetId: "newagent@example.com" });
  });
});
