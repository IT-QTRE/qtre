/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { ForbiddenError } from "./permissions";
import { assertCanWriteMedia, assertCanReadMedia } from "./mediaAuthorization";

const modules = import.meta.glob("../**/*.ts");

async function seedUser(t: ReturnType<typeof convexTest>, tokenIdentifier: string, role: "admin" | "agent" | "client") {
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

describe("assertCanWriteMedia", () => {
  test("admin can attach media to any entity type", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, "clerk|admin-1", "admin");
    await t.run(async (ctx) => {
      const identity = { tokenIdentifier: "clerk|admin-1" };
      // @ts-expect-error convex-test identity shape
      ctx.auth = { getUserIdentity: async () => identity };
      await assertCanWriteMedia(ctx, "create", "property", "some-property-id");
    });
  });

  test("client cannot attach media to a property (not their own resource type)", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, "clerk|client-1", "client");
    const asClient = t.withIdentity({ tokenIdentifier: "clerk|client-1" });
    await expect(
      asClient.run(async (ctx) => assertCanWriteMedia(ctx, "create", "property", "some-property-id")),
    ).rejects.toThrow(ForbiddenError);
  });

  test("client can attach media to their own pending submission", async () => {
    const t = convexTest(schema, modules);
    const clientId = await seedUser(t, "clerk|client-2", "client");
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        title: "My place",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        areaSqft: 50,
        countryCode: "AE",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    const asClient = t.withIdentity({ tokenIdentifier: "clerk|client-2" });
    await asClient.run(async (ctx) => assertCanWriteMedia(ctx, "create", "propertySubmission", submissionId));
  });

  test("client cannot attach media to someone else's submission", async () => {
    const t = convexTest(schema, modules);
    const otherClientId = await seedUser(t, "clerk|client-3", "client");
    await seedUser(t, "clerk|client-4", "client");
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId: otherClientId,
        title: "Not yours",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        areaSqft: 50,
        countryCode: "AE",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    const asOtherClient = t.withIdentity({ tokenIdentifier: "clerk|client-4" });
    await expect(
      asOtherClient.run(async (ctx) => assertCanWriteMedia(ctx, "create", "propertySubmission", submissionId)),
    ).rejects.toThrow(ForbiddenError);
  });

  test("client cannot modify their own submission's media once it's under review", async () => {
    const t = convexTest(schema, modules);
    const clientId = await seedUser(t, "clerk|client-5", "client");
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        title: "My place",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        areaSqft: 50,
        countryCode: "AE",
        status: "under_review",
        submittedAt: Date.now(),
      });
    });
    const asClient = t.withIdentity({ tokenIdentifier: "clerk|client-5" });
    await expect(
      asClient.run(async (ctx) => assertCanWriteMedia(ctx, "delete", "propertySubmission", submissionId)),
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("assertCanReadMedia", () => {
  test("allows an unauthenticated caller to read public entity types", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => assertCanReadMedia(ctx, "property", "some-property-id"));
  });

  test("rejects an unauthenticated caller reading a private propertySubmission", async () => {
    const t = convexTest(schema, modules);
    const clientId = await seedUser(t, "clerk|client-6", "client");
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        title: "My place",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        areaSqft: 50,
        countryCode: "AE",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    await expect(
      t.run(async (ctx) => assertCanReadMedia(ctx, "propertySubmission", submissionId)),
    ).rejects.toThrow(ForbiddenError);
  });
});
