/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

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
