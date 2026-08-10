/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { ForbiddenError, requireRole } from "./permissions";

const modules = import.meta.glob("../**/*.ts");

describe("requireRole", () => {
  test("throws when there is no authenticated identity", async () => {
    const t = convexTest(schema, modules);
    await expect(t.run(async (ctx) => requireRole(ctx, "properties", "read"))).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("throws when the identity has no matching users row", async () => {
    const t = convexTest(schema, modules);
    const asUnknown = t.withIdentity({ tokenIdentifier: "clerk|unknown" });
    await expect(asUnknown.run(async (ctx) => requireRole(ctx, "properties", "read"))).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("throws when the user's role lacks the action", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-1",
        email: "owner@example.com",
        name: "Property Owner",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const asClient = t.withIdentity({ tokenIdentifier: "clerk|client-1" });
    await expect(asClient.run(async (ctx) => requireRole(ctx, "properties", "delete"))).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("returns the user row when the role has the action", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        createdAt: Date.now(),
      });
    });
    const asAdmin = t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
    const user = await asAdmin.run(async (ctx) => requireRole(ctx, "properties", "create"));
    expect(user.role).toBe("admin");
  });
});
