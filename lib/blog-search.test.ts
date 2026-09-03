import { describe, expect, it } from "vitest";
import { blogHasFilters, blogQueryArgs, blogSearchFromParams, blogSearchHref } from "./blog-search";

describe("blogSearchFromParams", () => {
  it("trims and drops empty values", () => {
    expect(blogSearchFromParams({ q: "  golden  ", topic: " visa " })).toEqual({
      q: "golden",
      topic: "visa",
    });
    expect(blogSearchFromParams({ q: "  ", topic: "" })).toEqual({});
  });
});

describe("blogSearchHref", () => {
  it("builds a locale-free path", () => {
    expect(blogSearchHref()).toBe("/blog");
    expect(blogSearchHref({ q: "golden", topic: "visa" })).toBe("/blog?q=golden&topic=visa");
  });
});

describe("blogQueryArgs", () => {
  it("omits unset filters", () => {
    expect(blogQueryArgs({})).toEqual({});
    expect(blogHasFilters({ q: "a" })).toBe(true);
    expect(blogHasFilters({})).toBe(false);
  });
});
