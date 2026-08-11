/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(
  t: ReturnType<typeof convexTest>,
  tokenIdentifier: string,
  role: "super_admin" | "admin" | "agent" | "client",
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      tokenIdentifier,
      email: `${tokenIdentifier}@example.com`,
      name: tokenIdentifier,
      role,
      createdAt: Date.now(),
    });
  });
}

describe("users.current", () => {
  test("returns null when not authenticated", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.users.current, {});
    expect(result).toBeNull();
  });

  test("returns the matching row for the authenticated identity", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|user-1",
        email: "user1@example.com",
        name: "User One",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const asUser = t.withIdentity({ tokenIdentifier: "clerk|user-1" });
    const result = await asUser.query(api.users.current, {});
    expect(result?.email).toBe("user1@example.com");
  });
});

describe("users.upsert (internal)", () => {
  test("inserts a new row when none exists, and is idempotent on a second call", async () => {
    const t = convexTest(schema, modules);
    const args = {
      tokenIdentifier: "clerk|user-2",
      email: "user2@example.com",
      name: "User Two",
      role: "client" as const,
    };
    const firstId = await t.mutation(internal.users.upsert, args);
    const secondId = await t.mutation(internal.users.upsert, args);
    expect(secondId).toBe(firstId);

    const rows = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(rows).toHaveLength(1);
  });

  test("self-heals a blank email/name captured on an earlier visit without touching role", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        tokenIdentifier: "clerk|user-3",
        email: "",
        name: "Unknown",
        role: "super_admin",
        createdAt: Date.now(),
      }),
    );

    const returnedId = await t.mutation(internal.users.upsert, {
      tokenIdentifier: "clerk|user-3",
      email: "real@example.com",
      name: "Real Name",
      role: "client",
    });

    expect(returnedId).toBe(id);
    const row = await t.run(async (ctx) => ctx.db.get(id));
    expect(row?.email).toBe("real@example.com");
    expect(row?.name).toBe("Real Name");
    // Role is intentionally never overwritten by re-provisioning.
    expect(row?.role).toBe("super_admin");
  });

  test("does not blank out an existing email/name when the identity provides empty values", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        tokenIdentifier: "clerk|user-4",
        email: "existing@example.com",
        name: "Existing Name",
        role: "client",
        createdAt: Date.now(),
      }),
    );

    await t.mutation(internal.users.upsert, {
      tokenIdentifier: "clerk|user-4",
      email: "",
      name: "",
      role: "client",
    });

    const row = await t.run(async (ctx) => ctx.db.get(id));
    expect(row?.email).toBe("existing@example.com");
    expect(row?.name).toBe("Existing Name");
  });
});

describe("users.getByTokenIdentifier (internal)", () => {
  test("returns null for an unknown identity", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(internal.users.getByTokenIdentifier, {
      tokenIdentifier: "clerk|unknown",
    });
    expect(result).toBeNull();
  });
});

describe("users.getById", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    const targetId = await seedUser(t, "clerk|target-1", "agent");
    await expect(t.query(api.users.getById, { id: targetId })).rejects.toThrow(ForbiddenError);
  });

  test("rejects a client (no users:read permission)", async () => {
    const t = convexTest(schema, modules);
    const targetId = await seedUser(t, "clerk|target-1", "agent");
    const clientTokenIdentifier = "clerk|client-1";
    await seedUser(t, clientTokenIdentifier, "client");
    const asClient = t.withIdentity({ tokenIdentifier: clientTokenIdentifier });
    await expect(asClient.query(api.users.getById, { id: targetId })).rejects.toThrow(ForbiddenError);
  });

  test("an admin can resolve a user by id", async () => {
    const t = convexTest(schema, modules);
    const targetId = await seedUser(t, "clerk|target-1", "agent");
    const adminTokenIdentifier = "clerk|admin-1";
    await seedUser(t, adminTokenIdentifier, "admin");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    const result = await asAdmin.query(api.users.getById, { id: targetId });
    expect(result?.email).toBe("clerk|target-1@example.com");
  });
});

describe("users.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.users.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects a client (no users:read)", async () => {
    const t = convexTest(schema, modules);
    const clientTokenIdentifier = "clerk|client-1";
    await seedUser(t, clientTokenIdentifier, "client");
    const asClient = t.withIdentity({ tokenIdentifier: clientTokenIdentifier });
    await expect(asClient.query(api.users.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list users", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, "clerk|user-a", "client");
    await seedUser(t, "clerk|user-b", "agent");
    const adminTokenIdentifier = "clerk|admin-1";
    await seedUser(t, adminTokenIdentifier, "admin");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    const result = await asAdmin.query(api.users.list, {});
    expect(result).toHaveLength(3);
  });
});

describe("users.updateRole", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    const targetId = await seedUser(t, "clerk|target-1", "client");
    await expect(t.mutation(api.users.updateRole, { id: targetId, role: "agent" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("rejects a client (no users:update)", async () => {
    const t = convexTest(schema, modules);
    const targetId = await seedUser(t, "clerk|target-1", "client");
    const clientTokenIdentifier = "clerk|client-1";
    await seedUser(t, clientTokenIdentifier, "client");
    const asClient = t.withIdentity({ tokenIdentifier: clientTokenIdentifier });
    await expect(asClient.mutation(api.users.updateRole, { id: targetId, role: "agent" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("blocks an admin from changing their own role", async () => {
    const t = convexTest(schema, modules);
    const adminTokenIdentifier = "clerk|admin-1";
    const adminId = await seedUser(t, adminTokenIdentifier, "admin");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    await expect(asAdmin.mutation(api.users.updateRole, { id: adminId, role: "agent" })).rejects.toThrow(
      "Cannot change your own role",
    );
  });

  test("blocks a super_admin from changing their own role", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    const superAdminId = await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });
    await expect(
      asSuperAdmin.mutation(api.users.updateRole, { id: superAdminId, role: "agent" }),
    ).rejects.toThrow("Cannot change your own role");
  });

  test("admin cannot promote a client to admin", async () => {
    const t = convexTest(schema, modules);
    const adminTokenIdentifier = "clerk|admin-1";
    await seedUser(t, adminTokenIdentifier, "admin");
    const targetId = await seedUser(t, "clerk|client-1", "client");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    await expect(asAdmin.mutation(api.users.updateRole, { id: targetId, role: "admin" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("admin cannot change an existing admin's role", async () => {
    const t = convexTest(schema, modules);
    const adminTokenIdentifier = "clerk|admin-1";
    await seedUser(t, adminTokenIdentifier, "admin");
    const otherAdminId = await seedUser(t, "clerk|admin-2", "admin");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    await expect(asAdmin.mutation(api.users.updateRole, { id: otherAdminId, role: "agent" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("admin cannot change an existing super_admin's role", async () => {
    const t = convexTest(schema, modules);
    const adminTokenIdentifier = "clerk|admin-1";
    await seedUser(t, adminTokenIdentifier, "admin");
    const superAdminId = await seedUser(t, "clerk|super-1", "super_admin");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    await expect(asAdmin.mutation(api.users.updateRole, { id: superAdminId, role: "client" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("admin can change a client to agent", async () => {
    const t = convexTest(schema, modules);
    const adminTokenIdentifier = "clerk|admin-1";
    await seedUser(t, adminTokenIdentifier, "admin");
    const targetId = await seedUser(t, "clerk|client-1", "client");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    await asAdmin.mutation(api.users.updateRole, { id: targetId, role: "agent" });
    const updated = await t.run(async (ctx) => await ctx.db.get(targetId));
    expect(updated?.role).toBe("agent");
  });

  test("super_admin can change an admin's role", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const adminId = await seedUser(t, "clerk|admin-1", "admin");
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });
    await asSuperAdmin.mutation(api.users.updateRole, { id: adminId, role: "agent" });
    const updated = await t.run(async (ctx) => await ctx.db.get(adminId));
    expect(updated?.role).toBe("agent");
  });

  test("super_admin can promote a client to admin", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const clientId = await seedUser(t, "clerk|client-1", "client");
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });
    await asSuperAdmin.mutation(api.users.updateRole, { id: clientId, role: "admin" });
    const updated = await t.run(async (ctx) => await ctx.db.get(clientId));
    expect(updated?.role).toBe("admin");
  });

  test("throws User not found for a nonexistent target id", async () => {
    const t = convexTest(schema, modules);
    const adminTokenIdentifier = "clerk|admin-1";
    await seedUser(t, adminTokenIdentifier, "admin");
    const missingId = await seedUser(t, "clerk|to-delete", "client");
    await t.run(async (ctx) => {
      await ctx.db.delete(missingId);
    });
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    await expect(asAdmin.mutation(api.users.updateRole, { id: missingId, role: "agent" })).rejects.toThrow(
      "User not found",
    );
    await expect(asAdmin.mutation(api.users.updateRole, { id: missingId, role: "agent" })).rejects.not.toThrow(
      ForbiddenError,
    );
  });

  test("writes exactly one audit log entry on success", async () => {
    const t = convexTest(schema, modules);
    const adminTokenIdentifier = "clerk|admin-1";
    await seedUser(t, adminTokenIdentifier, "admin");
    const targetId = await seedUser(t, "clerk|client-1", "client");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });
    await asAdmin.mutation(api.users.updateRole, { id: targetId, role: "agent" });
    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.resource).toBe("users");
    expect(auditLogs[0]?.action).toBe("update_role");
    expect(auditLogs[0]?.targetId).toBe(targetId);
  });
});

describe("users.updateResourceAccess", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    const targetId = await seedUser(t, "clerk|admin-1", "admin");
    await expect(
      t.mutation(api.users.updateResourceAccess, { id: targetId, disabledResources: [] }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("rejects an admin — must not be able to change its own or another admin's access via the generic users:update grant", async () => {
    const t = convexTest(schema, modules);
    const adminTokenIdentifier = "clerk|admin-1";
    const adminId = await seedUser(t, adminTokenIdentifier, "admin");
    const otherAdminId = await seedUser(t, "clerk|admin-2", "admin");
    const asAdmin = t.withIdentity({ tokenIdentifier: adminTokenIdentifier });

    await expect(
      asAdmin.mutation(api.users.updateResourceAccess, { id: adminId, disabledResources: [] }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      asAdmin.mutation(api.users.updateResourceAccess, { id: otherAdminId, disabledResources: [] }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("rejects an agent", async () => {
    const t = convexTest(schema, modules);
    const agentTokenIdentifier = "clerk|agent-1";
    await seedUser(t, agentTokenIdentifier, "agent");
    const targetId = await seedUser(t, "clerk|admin-1", "admin");
    const asAgent = t.withIdentity({ tokenIdentifier: agentTokenIdentifier });
    await expect(
      asAgent.mutation(api.users.updateResourceAccess, { id: targetId, disabledResources: [] }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("throws User not found for a nonexistent target id", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const missingId = await seedUser(t, "clerk|to-delete", "admin");
    await t.run(async (ctx) => {
      await ctx.db.delete(missingId);
    });
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });
    await expect(
      asSuperAdmin.mutation(api.users.updateResourceAccess, { id: missingId, disabledResources: [] }),
    ).rejects.toThrow("User not found");
  });

  test("a super_admin cannot set access restrictions on a non-admin account (agent, client, or super_admin)", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const agentId = await seedUser(t, "clerk|agent-1", "agent");
    const clientId = await seedUser(t, "clerk|client-1", "client");
    const otherSuperAdminId = await seedUser(t, "clerk|super-2", "super_admin");
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });

    await expect(
      asSuperAdmin.mutation(api.users.updateResourceAccess, { id: agentId, disabledResources: [] }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      asSuperAdmin.mutation(api.users.updateResourceAccess, { id: clientId, disabledResources: [] }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      asSuperAdmin.mutation(api.users.updateResourceAccess, { id: otherSuperAdminId, disabledResources: [] }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("a super_admin can set a specific admin's disabled resources without affecting other admins", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const targetAdminId = await seedUser(t, "clerk|admin-1", "admin");
    const otherAdminId = await seedUser(t, "clerk|admin-2", "admin");
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });

    await asSuperAdmin.mutation(api.users.updateResourceAccess, {
      id: targetAdminId,
      disabledResources: ["properties", "leads"],
    });

    const targetAdmin = await t.run(async (ctx) => await ctx.db.get(targetAdminId));
    const otherAdmin = await t.run(async (ctx) => await ctx.db.get(otherAdminId));
    expect(targetAdmin?.disabledResources).toEqual(["properties", "leads"]);
    expect(otherAdmin?.disabledResources).toBeUndefined();
  });

  test("a super_admin can clear a specific admin's disabled resources back to empty", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const targetAdminId = await seedUser(t, "clerk|admin-1", "admin");
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });

    await asSuperAdmin.mutation(api.users.updateResourceAccess, {
      id: targetAdminId,
      disabledResources: ["properties"],
    });
    await asSuperAdmin.mutation(api.users.updateResourceAccess, { id: targetAdminId, disabledResources: [] });

    const targetAdmin = await t.run(async (ctx) => await ctx.db.get(targetAdminId));
    expect(targetAdmin?.disabledResources).toEqual([]);
  });

  test("writes an audit log entry under resource users action update_resource_access", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const targetAdminId = await seedUser(t, "clerk|admin-1", "admin");
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });

    await asSuperAdmin.mutation(api.users.updateResourceAccess, {
      id: targetAdminId,
      disabledResources: ["properties"],
    });

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(
      auditLogs.some(
        (log) =>
          log.resource === "users" &&
          log.action === "update_resource_access" &&
          log.targetId === targetAdminId,
      ),
    ).toBe(true);
  });

  test("end-to-end: the restricted admin is blocked from api.properties.list, but another admin and super_admin are unaffected", async () => {
    const t = convexTest(schema, modules);
    const superAdminTokenIdentifier = "clerk|super-1";
    await seedUser(t, superAdminTokenIdentifier, "super_admin");
    const restrictedAdminTokenIdentifier = "clerk|admin-1";
    const restrictedAdminId = await seedUser(t, restrictedAdminTokenIdentifier, "admin");
    const unrestrictedAdminTokenIdentifier = "clerk|admin-2";
    await seedUser(t, unrestrictedAdminTokenIdentifier, "admin");
    const asSuperAdmin = t.withIdentity({ tokenIdentifier: superAdminTokenIdentifier });

    await asSuperAdmin.mutation(api.users.updateResourceAccess, {
      id: restrictedAdminId,
      disabledResources: ["properties"],
    });

    const asRestrictedAdmin = t.withIdentity({ tokenIdentifier: restrictedAdminTokenIdentifier });
    const asUnrestrictedAdmin = t.withIdentity({ tokenIdentifier: unrestrictedAdminTokenIdentifier });

    await expect(asRestrictedAdmin.query(api.properties.list, {})).rejects.toThrow(ForbiddenError);
    await expect(asUnrestrictedAdmin.query(api.properties.list, {})).resolves.toEqual([]);
    await expect(asSuperAdmin.query(api.properties.list, {})).resolves.toEqual([]);
  });
});
