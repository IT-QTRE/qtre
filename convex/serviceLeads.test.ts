import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(
  t: ReturnType<typeof convexTest>,
  tokenIdentifier: string,
  role: "super_admin" | "admin" | "agent" | "client",
) {
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

async function seedServiceLead(
  t: ReturnType<typeof convexTest>,
  overrides: {
    status?: "new" | "contacted" | "qualified" | "closed";
    assignedUserId?: Id<"users">;
    group?: "visa" | "license";
    desk?: "residence" | "renewal";
  } = {},
) {
  return await t.run(async (ctx) =>
    ctx.db.insert("serviceLeads", {
      name: "Amira Hassan",
      email: "amira@example.com",
      group: overrides.group ?? "visa",
      desk: overrides.desk ?? "residence",
      status: overrides.status ?? "new",
      assignedUserId: overrides.assignedUserId,
      createdAt: Date.now(),
    }),
  );
}

describe("serviceLeads.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.serviceLeads.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list service leads", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    await seedServiceLead(t);
    expect(await asAdmin.query(api.serviceLeads.list, {})).toHaveLength(1);
  });

  test("rejects an agent caller", async () => {
    const t = convexTest(schema, modules);
    await seedServiceLead(t);
    const { client: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.query(api.serviceLeads.list, {})).rejects.toThrow(ForbiddenError);
  });
});

describe("serviceLeads.newCount", () => {
  test("counts only new inquiries", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    await seedServiceLead(t);
    await seedServiceLead(t, { status: "contacted" });
    expect(await asAdmin.query(api.serviceLeads.newCount, {})).toBe(1);
  });
});

describe("serviceLeads.listAssignees", () => {
  test("returns Admin and Super Admin users only", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin, userId: adminId } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: superId } = await seedUser(t, "clerk|super-1", "super_admin");
    await seedUser(t, "clerk|agent-1", "agent");
    await seedUser(t, "clerk|client-1", "client");

    const assignees = await asAdmin.query(api.serviceLeads.listAssignees, {});
    const ids = assignees.map((user) => user._id);
    expect(ids).toContain(adminId);
    expect(ids).toContain(superId);
    expect(assignees).toHaveLength(2);
  });
});

describe("serviceLeads.update", () => {
  test("rejects a client caller", async () => {
    const t = convexTest(schema, modules);
    const leadId = await seedServiceLead(t);
    const { client: asClient } = await seedUser(t, "clerk|client-1", "client");
    await expect(
      asClient.mutation(api.serviceLeads.update, { id: leadId, status: "contacted" }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("an admin can assign another admin and later unassign", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: otherAdminId } = await seedUser(t, "clerk|admin-2", "admin");
    const leadId = await seedServiceLead(t);

    await asAdmin.mutation(api.serviceLeads.update, {
      id: leadId,
      status: "contacted",
      assignedUserId: otherAdminId,
    });
    let updated = await asAdmin.query(api.serviceLeads.get, { id: leadId });
    expect(updated?.status).toBe("contacted");
    expect(updated?.assignedUserId).toBe(otherAdminId);

    await asAdmin.mutation(api.serviceLeads.update, { id: leadId, status: "qualified" });
    updated = await asAdmin.query(api.serviceLeads.get, { id: leadId });
    expect(updated?.status).toBe("qualified");
    expect(updated?.assignedUserId).toBeUndefined();
  });

  test("rejects assigning an agent", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: agentId } = await seedUser(t, "clerk|agent-1", "agent");
    const leadId = await seedServiceLead(t);

    await expect(
      asAdmin.mutation(api.serviceLeads.update, {
        id: leadId,
        status: "contacted",
        assignedUserId: agentId,
      }),
    ).rejects.toThrow("Can only assign to an Admin");
  });

  test("writes an audit log entry on success", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const leadId = await seedServiceLead(t);

    await asAdmin.mutation(api.serviceLeads.update, { id: leadId, status: "contacted" });

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(
      auditLogs.some(
        (log) => log.resource === "serviceLeads" && log.action === "update" && log.targetId === leadId,
      ),
    ).toBe(true);
  });
});

describe("serviceLeads.remove", () => {
  test("rejects an agent caller", async () => {
    const t = convexTest(schema, modules);
    const leadId = await seedServiceLead(t);
    const { client: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.serviceLeads.remove, { id: leadId })).rejects.toThrow(ForbiddenError);
  });

  test("an admin can delete an inquiry", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const leadId = await seedServiceLead(t);

    await asAdmin.mutation(api.serviceLeads.remove, { id: leadId });
    expect(await asAdmin.query(api.serviceLeads.get, { id: leadId })).toBeNull();
  });
});
