import { describe, expect, it } from "vitest";
import { blogPostSchema, compactRelated, compactTopicName, relatedSchema } from "./blogPosts";

describe("blogPostSchema", () => {
  it("requires localized title/body, authorUserId, and publishing", () => {
    const base = {
      title: { en: "Dubai Market Update" },
      body: { en: "The market is..." },
      authorUserId: "some-user-id",
      publishing: { slug: "dubai-market-update", status: "published", updatedAt: Date.now() },
    };
    expect(blogPostSchema.safeParse(base).success).toBe(true);
    const { authorUserId: _authorUserId, ...missingAuthor } = base;
    expect(blogPostSchema.safeParse(missingAuthor).success).toBe(false);
  });

  it("accepts an empty related list and up to four unique items", () => {
    const base = {
      title: { en: "Dubai Market Update" },
      body: { en: "The market is..." },
      authorUserId: "some-user-id",
      publishing: { slug: "dubai-market-update", status: "published", updatedAt: Date.now() },
    };
    expect(blogPostSchema.safeParse({ ...base, related: [] }).success).toBe(true);
    expect(
      blogPostSchema.safeParse({
        ...base,
        related: [
          { type: "property", id: "p1" },
          { type: "project", id: "j1" },
          { type: "blogPost", id: "b1" },
          { type: "property", id: "p2" },
        ],
      }).success,
    ).toBe(true);
    expect(
      blogPostSchema.safeParse({
        ...base,
        related: [
          { type: "property", id: "p1" },
          { type: "property", id: "p2" },
          { type: "property", id: "p3" },
          { type: "property", id: "p4" },
          { type: "property", id: "p5" },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("relatedSchema", () => {
  it("rejects the same record twice", () => {
    expect(
      relatedSchema.safeParse([
        { type: "property", id: "p1" },
        { type: "property", id: "p1" },
      ]).success,
    ).toBe(false);
  });
});

describe("compactRelated", () => {
  it("omits empty lists and blank rows", () => {
    expect(compactRelated(undefined)).toBeUndefined();
    expect(compactRelated([])).toBeUndefined();
    expect(compactRelated([{ type: "property", id: "" }])).toBeUndefined();
  });

  it("rejects the current post", () => {
    expect(() => compactRelated([{ type: "blogPost", id: "self" }], "self")).toThrow(
      "A post cannot list itself in Also see",
    );
  });
});

describe("compactTopicName", () => {
  it("trims and keeps blank as an empty string", () => {
    expect(compactTopicName(undefined)).toBe("");
    expect(compactTopicName("  ")).toBe("");
    expect(compactTopicName(" Visa ")).toBe("Visa");
  });
});
