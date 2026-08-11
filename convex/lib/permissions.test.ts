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

  test("blocks an admin from a resource a Super Admin has disabled on their account", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        createdAt: Date.now(),
        disabledResources: ["properties"],
      });
    });
    const asAdmin = t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
    await expect(asAdmin.run(async (ctx) => requireRole(ctx, "properties", "read"))).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("does not block an admin from a resource that is not in their disabled list", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        createdAt: Date.now(),
        disabledResources: ["properties"],
      });
    });
    const asAdmin = t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
    const user = await asAdmin.run(async (ctx) => requireRole(ctx, "projects", "read"));
    expect(user.role).toBe("admin");
  });

  test("only restricts the specific admin account the disabled list was set on, not other admins", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin1@example.com",
        name: "Restricted Admin",
        role: "admin",
        createdAt: Date.now(),
        disabledResources: ["properties"],
      });
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-2",
        email: "admin2@example.com",
        name: "Unrestricted Admin",
        role: "admin",
        createdAt: Date.now(),
      });
    });
    const asOtherAdmin = t.withIdentity({ tokenIdentifier: "clerk|admin-2" });
    const user = await asOtherAdmin.run(async (ctx) => requireRole(ctx, "properties", "read"));
    expect(user.role).toBe("admin");
  });

  test("never blocks super_admin, even if it somehow had a disabled list", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|super-1",
        email: "super@example.com",
        name: "Super Admin User",
        role: "super_admin",
        createdAt: Date.now(),
        disabledResources: ["properties"],
      });
    });
    const asSuper = t.withIdentity({ tokenIdentifier: "clerk|super-1" });
    const user = await asSuper.run(async (ctx) => requireRole(ctx, "properties", "read"));
    expect(user.role).toBe("super_admin");
  });

  test("does not block an admin with no disabledResources set", async () => {
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
    const user = await asAdmin.run(async (ctx) => requireRole(ctx, "properties", "read"));
    expect(user.role).toBe("admin");
  });
});
