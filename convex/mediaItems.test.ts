/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";
import { requiredPathnamePrefix } from "./lib/mediaAccessConfig";

const modules = import.meta.glob("./**/*.ts");

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: "clerk|admin-1",
      email: "admin1@example.com",
      name: "Admin One",
      role: "admin",
      createdAt: Date.now(),
    });
  });
  return t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
}

async function seedUser(
  t: ReturnType<typeof convexTest>,
  tokenIdentifier: string,
  role: "admin" | "agent" | "client" | "super_admin",
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier,
      email: `${tokenIdentifier}@example.com`,
      name: tokenIdentifier,
      role,
      createdAt: Date.now(),
    });
  });
  return t.withIdentity({ tokenIdentifier });
}

describe("mediaItems.create + listByEntity", () => {
  test("inserts a row with an auto-incrementing order, and lists it back", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    const firstId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-1",
      url: "https://example.public.blob.vercel-storage.com/a.webp",
      pathname: `${requiredPathnamePrefix("property", "prop-1")}a.webp`,
      mimeType: "image/webp",
    });
    const secondId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-1",
      url: "https://example.public.blob.vercel-storage.com/b.webp",
      pathname: `${requiredPathnamePrefix("property", "prop-1")}b.webp`,
      mimeType: "image/webp",
    });

    const items = await asAdmin.query(api.mediaItems.listByEntity, { entityType: "property", entityId: "prop-1" });
    expect(items.map((i) => i._id)).toEqual([firstId, secondId]);
    expect(items[0].order).toBe(0);
    expect(items[1].order).toBe(1);
  });

  test("lists photos by order even when rows were inserted out of sequence", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const prefix = requiredPathnamePrefix("property", "prop-order");

    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: "prop-order",
        url: "https://example.public.blob.vercel-storage.com/kitchen.webp",
        pathname: `${prefix}kitchen.webp`,
        mimeType: "image/webp",
        order: 2,
      });
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: "prop-order",
        url: "https://example.public.blob.vercel-storage.com/cover.webp",
        pathname: `${prefix}cover.webp`,
        mimeType: "image/webp",
        order: 0,
      });
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: "prop-order",
        url: "https://example.public.blob.vercel-storage.com/living.webp",
        pathname: `${prefix}living.webp`,
        mimeType: "image/webp",
        order: 1,
      });
    });

    const items = await asAdmin.query(api.mediaItems.listByEntity, {
      entityType: "property",
      entityId: "prop-order",
    });
    expect(items.map((item) => item.pathname)).toEqual([
      `${prefix}cover.webp`,
      `${prefix}living.webp`,
      `${prefix}kitchen.webp`,
    ]);
    expect(items.map((item) => item.order)).toEqual([0, 1, 2]);
  });

  test("an unauthenticated caller can still list public media (Phase 5 will rely on this)", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-2",
      url: "https://example.public.blob.vercel-storage.com/c.webp",
      pathname: `${requiredPathnamePrefix("property", "prop-2")}c.webp`,
      mimeType: "image/webp",
    });

    const items = await t.query(api.mediaItems.listByEntity, { entityType: "property", entityId: "prop-2" });
    expect(items).toHaveLength(1);
  });
});

describe("mediaItems.reorder", () => {
  test("rejects an id that doesn't belong to the given entity", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const realId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-3",
      url: "https://example.public.blob.vercel-storage.com/d.webp",
      pathname: `${requiredPathnamePrefix("property", "prop-3")}d.webp`,
      mimeType: "image/webp",
    });
    const otherId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-4",
      url: "https://example.public.blob.vercel-storage.com/e.webp",
      pathname: `${requiredPathnamePrefix("property", "prop-4")}e.webp`,
      mimeType: "image/webp",
    });

    await expect(
      asAdmin.mutation(api.mediaItems.reorder, {
        entityType: "property",
        entityId: "prop-3",
        orderedIds: [realId, otherId],
      }),
    ).rejects.toThrow();
  });
});

describe("mediaItems.getForDelete + deleteRecord", () => {
  test("a client cannot delete media belonging to someone else's submission", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-a",
        email: "a@example.com",
        name: "Client A",
        role: "client",
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-b",
        email: "b@example.com",
        name: "Client B",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const clientAId = await t.run(async (ctx) => {
      return (await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|client-a"))
        .unique())!._id;
    });
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId: clientAId,
        title: "A's place",
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
    const asClientA = t.withIdentity({ tokenIdentifier: "clerk|client-a" });
    const mediaItemId = await asClientA.mutation(api.mediaItems.create, {
      entityType: "propertySubmission",
      entityId: submissionId,
      url: "https://example.private.blob.vercel-storage.com/deed.pdf",
      pathname: `${requiredPathnamePrefix("propertySubmission", submissionId)}deed.pdf`,
      mimeType: "application/pdf",
    });

    const asClientB = t.withIdentity({ tokenIdentifier: "clerk|client-b" });
    await expect(asClientB.query(api.mediaItems.getForDelete, { mediaItemId })).rejects.toThrow(ForbiddenError);
    await expect(asClientB.mutation(api.mediaItems.deleteRecord, { mediaItemId })).rejects.toThrow(ForbiddenError);
  });

  test("getForDelete returns null (not a throw) for an already-deleted item — mirrors deleteRecord's own no-op-on-missing behavior", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const mediaItemId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-already-deleted",
      url: "https://example.public.blob.vercel-storage.com/g.webp",
      pathname: `${requiredPathnamePrefix("property", "prop-already-deleted")}g.webp`,
      mimeType: "image/webp",
    });
    await asAdmin.mutation(api.mediaItems.deleteRecord, { mediaItemId });

    // A second delete attempt on the same id (e.g. a double-click on
    // "Remove") should be a harmless no-op, not a hard error.
    await expect(asAdmin.query(api.mediaItems.getForDelete, { mediaItemId })).resolves.toBeNull();
    await expect(asAdmin.mutation(api.mediaItems.deleteRecord, { mediaItemId })).resolves.toBeNull();
  });
});

describe("mediaItems.create — pathname must belong to the entity (regression for a Phase 3 security review finding)", () => {
  test("rejects a pathname prefixed with a DIFFERENT entityId than the one being authorized", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    // Without the prefix check, a caller authorized for their OWN entityId
    // ("prop-mine") could still claim ownership of a pathname that really
    // belongs to a different entity ("prop-victim") — e.g. one they saw in
    // a leaked URL — and the row would be created because `create`'s
    // authorization only checks entityId ownership, never that pathname
    // has anything to do with it.
    await expect(
      asAdmin.mutation(api.mediaItems.create, {
        entityType: "property",
        entityId: "prop-mine",
        url: "https://example.public.blob.vercel-storage.com/stolen.webp",
        pathname: `${requiredPathnamePrefix("property", "prop-victim")}stolen.webp`,
        mimeType: "image/webp",
      }),
    ).rejects.toThrow();
  });

  test("accepts a pathname correctly prefixed with the entity's own namespace", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    await expect(
      asAdmin.mutation(api.mediaItems.create, {
        entityType: "property",
        entityId: "prop-mine",
        url: "https://example.public.blob.vercel-storage.com/mine.webp",
        pathname: `${requiredPathnamePrefix("property", "prop-mine")}mine.webp`,
        mimeType: "image/webp",
      }),
    ).resolves.toBeDefined();
  });
});

describe("mediaItems.getForPrivateDelivery", () => {
  test("refuses to serve a PUBLIC entity's media through the private-delivery route", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const mediaItemId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-public-1",
      url: "https://example.public.blob.vercel-storage.com/f.webp",
      pathname: `${requiredPathnamePrefix("property", "prop-public-1")}f.webp`,
      mimeType: "image/webp",
    });

    await expect(asAdmin.query(api.mediaItems.getForPrivateDelivery, { mediaItemId })).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("a client cannot fetch delivery info for someone else's private submission document", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-c",
        email: "c@example.com",
        name: "Client C",
        role: "client",
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-d",
        email: "d@example.com",
        name: "Client D",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const clientCId = await t.run(async (ctx) => {
      return (await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|client-c"))
        .unique())!._id;
    });
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId: clientCId,
        title: "C's place",
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
    const asClientC = t.withIdentity({ tokenIdentifier: "clerk|client-c" });
    const mediaItemId = await asClientC.mutation(api.mediaItems.create, {
      entityType: "propertySubmission",
      entityId: submissionId,
      url: "https://example.private.blob.vercel-storage.com/title.pdf",
      pathname: `${requiredPathnamePrefix("propertySubmission", submissionId)}title.pdf`,
      mimeType: "application/pdf",
    });

    const asClientD = t.withIdentity({ tokenIdentifier: "clerk|client-d" });
    await expect(asClientD.query(api.mediaItems.getForPrivateDelivery, { mediaItemId })).rejects.toThrow(
      ForbiddenError,
    );
  });
});

describe("mediaItems.listAllPaginated", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.query(api.mediaItems.listAllPaginated, {
        paginationOpts: { numItems: 10, cursor: null },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("an admin gets an empty page when no media items exist", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const result = await asAdmin.query(api.mediaItems.listAllPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(result.page).toEqual([]);
    expect(result.isDone).toBe(true);
  });

  test("returns rows across multiple entity types when entityType is omitted", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: "prop-list-all-1",
        url: "https://example.public.blob.vercel-storage.com/prop.webp",
        pathname: `${requiredPathnamePrefix("property", "prop-list-all-1")}prop.webp`,
        mimeType: "image/webp",
        order: 0,
      });
      await ctx.db.insert("mediaItems", {
        entityType: "developer",
        entityId: "dev-list-all-1",
        url: "https://example.public.blob.vercel-storage.com/dev.webp",
        pathname: `${requiredPathnamePrefix("developer", "dev-list-all-1")}dev.webp`,
        mimeType: "image/webp",
        order: 0,
      });
    });

    const result = await asAdmin.query(api.mediaItems.listAllPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
    });

    expect(result.page.some((item) => item.entityType === "property")).toBe(true);
    expect(result.page.some((item) => item.entityType === "developer")).toBe(true);
  });

  test('entityType: "property" returns only property rows', async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: "prop-filter-1",
        url: "https://example.public.blob.vercel-storage.com/prop.webp",
        pathname: `${requiredPathnamePrefix("property", "prop-filter-1")}prop.webp`,
        mimeType: "image/webp",
        order: 0,
      });
      await ctx.db.insert("mediaItems", {
        entityType: "developer",
        entityId: "dev-filter-1",
        url: "https://example.public.blob.vercel-storage.com/dev.webp",
        pathname: `${requiredPathnamePrefix("developer", "dev-filter-1")}dev.webp`,
        mimeType: "image/webp",
        order: 0,
      });
    });

    const result = await asAdmin.query(api.mediaItems.listAllPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
      entityType: "property",
    });

    expect(result.page.length).toBeGreaterThan(0);
    expect(result.page.every((item) => item.entityType === "property")).toBe(true);
    expect(result.page.some((item) => item.entityType === "developer")).toBe(false);
  });

  test('entityType: "propertySubmission" throws ForbiddenError', async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    await expect(
      asAdmin.query(api.mediaItems.listAllPaginated, {
        paginationOpts: { numItems: 10, cursor: null },
        entityType: "propertySubmission",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test('security: "All" path never returns propertySubmission rows (admin)', async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    const clientId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-for-submission",
        email: "client-for-submission@example.com",
        name: "Client For Submission",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        title: "Private docs",
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

    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: "prop-public-all",
        url: "https://example.public.blob.vercel-storage.com/public.webp",
        pathname: `${requiredPathnamePrefix("property", "prop-public-all")}public.webp`,
        mimeType: "image/webp",
        order: 0,
      });
      await ctx.db.insert("mediaItems", {
        entityType: "propertySubmission",
        entityId: submissionId,
        url: "https://example.private.blob.vercel-storage.com/deed.pdf",
        pathname: `${requiredPathnamePrefix("propertySubmission", submissionId)}deed.pdf`,
        mimeType: "application/pdf",
        order: 0,
      });
    });

    const result = await asAdmin.query(api.mediaItems.listAllPaginated, {
      paginationOpts: { numItems: 50, cursor: null },
    });

    expect(result.page.some((item) => item.entityType === "property")).toBe(true);
    expect(result.page.some((item) => item.entityType === "propertySubmission")).toBe(false);
  });

  test('security: agent and client never see propertySubmission rows via "All"', async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-list-all", "agent");
    const asClient = await seedUser(t, "clerk|client-list-all", "client");

    const ownerClientId = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("users")
          .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|client-list-all"))
          .unique()
      )!._id;
    });
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId: ownerClientId,
        title: "Client's private docs",
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

    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: "prop-role-leak",
        url: "https://example.public.blob.vercel-storage.com/role.webp",
        pathname: `${requiredPathnamePrefix("property", "prop-role-leak")}role.webp`,
        mimeType: "image/webp",
        order: 0,
      });
      await ctx.db.insert("mediaItems", {
        entityType: "propertySubmission",
        entityId: submissionId,
        url: "https://example.private.blob.vercel-storage.com/title.pdf",
        pathname: `${requiredPathnamePrefix("propertySubmission", submissionId)}title.pdf`,
        mimeType: "application/pdf",
        order: 0,
      });
    });

    for (const asCaller of [asAgent, asClient]) {
      const result = await asCaller.query(api.mediaItems.listAllPaginated, {
        paginationOpts: { numItems: 50, cursor: null },
      });
      expect(result.page.some((item) => item.entityType === "property")).toBe(true);
      expect(result.page.some((item) => item.entityType === "propertySubmission")).toBe(false);
    }
  });

  test("pagination returns distinct pages via continueCursor", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    await t.run(async (ctx) => {
      for (let i = 1; i <= 5; i++) {
        await ctx.db.insert("mediaItems", {
          entityType: "property",
          entityId: `prop-page-${i}`,
          url: `https://example.public.blob.vercel-storage.com/p${i}.webp`,
          pathname: `${requiredPathnamePrefix("property", `prop-page-${i}`)}p${i}.webp`,
          mimeType: "image/webp",
          order: i,
        });
      }
    });

    const first = await asAdmin.query(api.mediaItems.listAllPaginated, {
      paginationOpts: { numItems: 2, cursor: null },
    });

    expect(first.page).toHaveLength(2);
    expect(first.isDone).toBe(false);
    expect(typeof first.continueCursor).toBe("string");
    expect(first.continueCursor.length).toBeGreaterThan(0);

    const second = await asAdmin.query(api.mediaItems.listAllPaginated, {
      paginationOpts: { numItems: 2, cursor: first.continueCursor },
    });

    expect(second.page).toHaveLength(2);
    const firstIds = new Set(first.page.map((row) => row._id));
    const secondIds = second.page.map((row) => row._id);
    expect(secondIds.every((id) => !firstIds.has(id))).toBe(true);
  });

  test("entityLabel is the English title when entityId is a real document", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const propertyId = await t.run(async (ctx) => {
      const createdBy = (
        await ctx.db
          .query("users")
          .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|admin-1"))
          .unique()
      )!._id;
      return await ctx.db.insert("properties", {
        price: 1_000_000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1000,
        countryCode: "AE",
        title: { en: "Marina View Apartment" },
        description: { en: "A unit." },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        createdBy,
        publishing: { slug: "marina-view-apartment", status: "published", updatedAt: Date.now() },
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: propertyId,
        url: "https://example.public.blob.vercel-storage.com/labeled.webp",
        pathname: `${requiredPathnamePrefix("property", propertyId)}labeled.webp`,
        mimeType: "image/webp",
        order: 0,
      });
    });

    const result = await asAdmin.query(api.mediaItems.listAllPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
      entityType: "property",
    });
    expect(result.page.some((item) => item.entityLabel === "Marina View Apartment")).toBe(true);
  });

  test("entityLabel is null when entityId is not a document id", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: "not-a-document-id",
        url: "https://example.public.blob.vercel-storage.com/orphan.webp",
        pathname: `${requiredPathnamePrefix("property", "not-a-document-id")}orphan.webp`,
        mimeType: "image/webp",
        order: 0,
      });
    });

    const result = await asAdmin.query(api.mediaItems.listAllPaginated, {
      paginationOpts: { numItems: 10, cursor: null },
      entityType: "property",
    });
    expect(result.page.every((item) => item.entityLabel === null)).toBe(true);
  });
});
