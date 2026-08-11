/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import schema from "./schema";
import { api } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(
  t: ReturnType<typeof convexTest>,
  tokenIdentifier: string,
  role: "admin" | "agent" | "client" | "super_admin",
) {
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      tokenIdentifier,
      email: `${tokenIdentifier}@example.com`,
      name: tokenIdentifier,
      role,
      createdAt: Date.now(),
    });
  });
  return { asUser: t.withIdentity({ tokenIdentifier }), userId };
}

async function seedAuditLog(
  t: ReturnType<typeof convexTest>,
  row: {
    actorUserId: Id<"users">;
    resource: string;
    action: string;
    createdAt: number;
    targetId?: string;
  },
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("auditLogs", row);
  });
}

describe("auditLogs.listPaginated", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.query(api.auditLogs.listPaginated, {
        paginationOpts: { numItems: 10, cursor: null },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("rejects an agent (no auditLogs:read)", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    await expect(
      asAgent.query(api.auditLogs.listPaginated, {
        paginationOpts: { numItems: 10, cursor: null },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("an admin gets an empty page when no audit logs exist", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const result = await asAdmin.query(api.auditLogs.listPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(result.page).toEqual([]);
    expect(result.isDone).toBe(true);
  });

  test("returns rows newest-first when no filters are set", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asAdmin, userId } = await seedUser(t, "clerk|admin-1", "admin");

    await seedAuditLog(t, {
      actorUserId: userId,
      resource: "developers",
      action: "create",
      createdAt: 1000,
    });
    await seedAuditLog(t, {
      actorUserId: userId,
      resource: "properties",
      action: "update",
      createdAt: 3000,
    });
    await seedAuditLog(t, {
      actorUserId: userId,
      resource: "projects",
      action: "delete",
      createdAt: 2000,
    });

    const result = await asAdmin.query(api.auditLogs.listPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page).toHaveLength(3);
    for (let i = 0; i < result.page.length - 1; i++) {
      expect(result.page[i].createdAt).toBeGreaterThanOrEqual(result.page[i + 1].createdAt);
    }
    expect(result.page.map((row) => row.createdAt)).toEqual([3000, 2000, 1000]);
  });

  test("resource filter returns only matching rows", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asAdmin, userId } = await seedUser(t, "clerk|admin-1", "admin");

    await seedAuditLog(t, {
      actorUserId: userId,
      resource: "developers",
      action: "create",
      createdAt: 1000,
    });
    await seedAuditLog(t, {
      actorUserId: userId,
      resource: "developers",
      action: "update",
      createdAt: 2000,
    });
    await seedAuditLog(t, {
      actorUserId: userId,
      resource: "properties",
      action: "create",
      createdAt: 3000,
    });

    const result = await asAdmin.query(api.auditLogs.listPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
      resource: "developers",
    });

    expect(result.page.length).toBeGreaterThan(0);
    expect(result.page.every((row) => row.resource === "developers")).toBe(true);
    expect(result.page.some((row) => row.resource === "properties")).toBe(false);
  });

  test("actorUserId filter (no resource) returns only that actor's rows", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asAdmin, userId: actorA } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: actorB } = await seedUser(t, "clerk|admin-2", "admin");

    await seedAuditLog(t, {
      actorUserId: actorA,
      resource: "developers",
      action: "create",
      createdAt: 1000,
    });
    await seedAuditLog(t, {
      actorUserId: actorB,
      resource: "developers",
      action: "create",
      createdAt: 2000,
    });
    await seedAuditLog(t, {
      actorUserId: actorA,
      resource: "properties",
      action: "update",
      createdAt: 3000,
    });

    const result = await asAdmin.query(api.auditLogs.listPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
      actorUserId: actorA,
    });

    expect(result.page.length).toBeGreaterThan(0);
    expect(result.page.every((row) => row.actorUserId === actorA)).toBe(true);
    expect(result.page.some((row) => row.actorUserId === actorB)).toBe(false);
  });

  test("resource takes precedence over actorUserId when both are provided", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asAdmin, userId: actorA } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: actorB } = await seedUser(t, "clerk|admin-2", "admin");

    await seedAuditLog(t, {
      actorUserId: actorA,
      resource: "developers",
      action: "create",
      createdAt: 1000,
    });
    await seedAuditLog(t, {
      actorUserId: actorA,
      resource: "properties",
      action: "create",
      createdAt: 2000,
    });
    await seedAuditLog(t, {
      actorUserId: actorB,
      resource: "developers",
      action: "update",
      createdAt: 3000,
    });

    const result = await asAdmin.query(api.auditLogs.listPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
      resource: "developers",
      actorUserId: actorA,
    });

    expect(result.page.some((row) => row.actorUserId === actorB && row.resource === "developers")).toBe(
      true,
    );
    expect(result.page.some((row) => row.resource === "properties")).toBe(false);
    expect(result.page.every((row) => row.resource === "developers")).toBe(true);
  });

  test("pagination returns distinct pages via continueCursor", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asAdmin, userId } = await seedUser(t, "clerk|admin-1", "admin");

    for (let i = 1; i <= 5; i++) {
      await seedAuditLog(t, {
        actorUserId: userId,
        resource: "developers",
        action: "create",
        createdAt: i * 1000,
        targetId: `row-${i}`,
      });
    }

    const first = await asAdmin.query(api.auditLogs.listPaginated, {
      paginationOpts: { numItems: 2, cursor: null },
    });

    expect(first.page).toHaveLength(2);
    expect(first.isDone).toBe(false);
    expect(typeof first.continueCursor).toBe("string");
    expect(first.continueCursor.length).toBeGreaterThan(0);

    const second = await asAdmin.query(api.auditLogs.listPaginated, {
      paginationOpts: { numItems: 2, cursor: first.continueCursor },
    });

    expect(second.page).toHaveLength(2);
    const firstIds = new Set(first.page.map((row) => row._id));
    const secondIds = second.page.map((row) => row._id);
    expect(secondIds.every((id) => !firstIds.has(id))).toBe(true);
  });
});

describe("auditLogs module surface", () => {
  test("has no mutation exports (static self-check)", () => {
    const source = readFileSync(join(import.meta.dirname, "auditLogs.ts"), "utf8");
    expect(source).toMatch(/export const listPaginated/);
    expect(source).not.toMatch(/\bmutation\s*\(/);
    expect(source).not.toMatch(/export const (create|update|remove|insert|write)\b/);
  });
});
