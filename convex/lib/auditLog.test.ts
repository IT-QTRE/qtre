/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { writeAuditLog } from "./auditLog";

const modules = import.meta.glob("../**/*.ts");

describe("writeAuditLog", () => {
  test("inserts a row with the given shape", async () => {
    const t = convexTest(schema, modules);
    const actorUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await writeAuditLog(ctx, {
        actorUserId,
        resource: "properties",
        action: "delete",
        targetId: "some-property-id",
      });
    });

    const logs = await t.run(async (ctx) => ctx.db.query("auditLogs").collect());
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      actorUserId,
      resource: "properties",
      action: "delete",
      targetId: "some-property-id",
    });
  });
});
