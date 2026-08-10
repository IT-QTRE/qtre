import { describe, expect, it } from "vitest";
import { blogPostSchema } from "./blogPosts";

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
});
