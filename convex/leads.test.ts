import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(t: ReturnType<typeof convexTest>, tokenIdentifier: string, role: "admin" | "agent" | "client") {
  const userId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      tokenIdentifier,
      email: `${tokenIdentifier}@example.com`,
      name: tokenIdentifier,
      role,
      createdAt: Date.now(),
    }),
  );
  return { client: t.withIdentity({ tokenIdentifier }), userId };
}

async function seedAgentProfile(t: ReturnType<typeof convexTest>, userId?: Id<"users">) {
  return await t.run(async (ctx) =>
    ctx.db.insert("agents", {
      name: "Jane Doe",
      email: "jane@example.com",
      userId,
      publishing: { slug: "jane-doe", status: "draft", updatedAt: Date.now() },
    }),
  );
}

async function seedLead(
  t: ReturnType<typeof convexTest>,
  overrides: {
    status?: "new" | "contacted" | "qualified" | "closed";
    assignedAgentId?: Id<"agents">;
  } = {},
) {
  return await t.run(async (ctx) =>
    ctx.db.insert("leads", {
      name: "John Smith",
      email: "john@example.com",
      phone: "+971500000000",
      message: "Interested in a property",
      status: overrides.status ?? "new",
      assignedAgentId: overrides.assignedAgentId,
      createdAt: Date.now(),
    }),
  );
}

describe("leads.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.leads.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list leads", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    await seedLead(t);
    const leads = await asAdmin.query(api.leads.list, {});
    expect(leads).toHaveLength(1);
  });

  test("an agent can list leads", async () => {
    const t = convexTest(schema, modules);
    await seedLead(t);
    const { client: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    const leads = await asAgent.query(api.leads.list, {});
    expect(leads).toHaveLength(1);
  });
});

describe("leads.update", () => {
  test("rejects a client caller", async () => {
    const t = convexTest(schema, modules);
    const leadId = await seedLead(t);
    const { client: asClient } = await seedUser(t, "clerk|client-1", "client");
    await expect(
      asClient.mutation(api.leads.update, { id: leadId, status: "contacted" }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("an admin can update any lead's status and assignedAgentId", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: otherAgentUserId } = await seedUser(t, "clerk|agent-2", "agent");
    const otherAgentProfileId = await seedAgentProfile(t, otherAgentUserId);
    const leadId = await seedLead(t);

    await expect(
      asAdmin.mutation(api.leads.update, {
        id: leadId,
        status: "qualified",
        assignedAgentId: otherAgentProfileId,
      }),
    ).resolves.toBeNull();

    const updated = await asAdmin.query(api.leads.get, { id: leadId });
    expect(updated?.status).toBe("qualified");
    expect(updated?.assignedAgentId).toBe(otherAgentProfileId);
  });

  test("an agent can update a lead assigned to their own agent profile", async () => {
    const t = convexTest(schema, modules);
    const { client: asAgent, userId: agentUserId } = await seedUser(t, "clerk|agent-1", "agent");
    const agentProfileId = await seedAgentProfile(t, agentUserId);
    const leadId = await seedLead(t, { assignedAgentId: agentProfileId });

    await expect(
      asAgent.mutation(api.leads.update, { id: leadId, status: "contacted" }),
    ).resolves.toBeNull();

    const updated = await asAgent.query(api.leads.get, { id: leadId });
    expect(updated?.status).toBe("contacted");
  });

  test("rejects an agent updating a lead assigned to a different agent", async () => {
    const t = convexTest(schema, modules);
    const { userId: ownerAgentUserId } = await seedUser(t, "clerk|agent-owner", "agent");
    const ownerAgentProfileId = await seedAgentProfile(t, ownerAgentUserId);
    const leadId = await seedLead(t, { assignedAgentId: ownerAgentProfileId });

    const { client: asOtherAgent, userId: otherAgentUserId } = await seedUser(t, "clerk|agent-other", "agent");
    await seedAgentProfile(t, otherAgentUserId);

    await expect(
      asOtherAgent.mutation(api.leads.update, { id: leadId, status: "contacted" }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("rejects an agent updating an unassigned lead", async () => {
    const t = convexTest(schema, modules);
    const leadId = await seedLead(t);
    const { client: asAgent, userId: agentUserId } = await seedUser(t, "clerk|agent-1", "agent");
    await seedAgentProfile(t, agentUserId);

    await expect(
      asAgent.mutation(api.leads.update, { id: leadId, status: "contacted" }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("throws a plain error for a nonexistent lead id", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const leadId = await seedLead(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(leadId);
    });

    await expect(
      asAdmin.mutation(api.leads.update, { id: leadId, status: "contacted" }),
    ).rejects.toThrow("Lead not found");
    await expect(
      asAdmin.mutation(api.leads.update, { id: leadId, status: "contacted" }),
    ).rejects.not.toThrow(ForbiddenError);
  });

  test("writes an audit log entry on success", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const leadId = await seedLead(t);

    await asAdmin.mutation(api.leads.update, { id: leadId, status: "contacted" });

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(
      auditLogs.some(
        (log) => log.resource === "leads" && log.action === "update" && log.targetId === leadId,
      ),
    ).toBe(true);
  });
});

describe("leads.remove", () => {
  test("rejects an agent caller", async () => {
    const t = convexTest(schema, modules);
    const leadId = await seedLead(t);
    const { client: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.leads.remove, { id: leadId })).rejects.toThrow(ForbiddenError);
  });

  test("an admin can delete a lead", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const leadId = await seedLead(t);

    await asAdmin.mutation(api.leads.remove, { id: leadId });
    const doc = await asAdmin.query(api.leads.get, { id: leadId });
    expect(doc).toBeNull();
  });

  test("writes an audit log entry on delete", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const leadId = await seedLead(t);

    await asAdmin.mutation(api.leads.remove, { id: leadId });

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(
      auditLogs.some(
        (log) => log.resource === "leads" && log.action === "delete" && log.targetId === leadId,
      ),
    ).toBe(true);
  });
});
