import { describe, expect, it } from "vitest";
import { homeSearchHref, isCatalogIndexPath, isPrimaryNavActive, isSecondaryNavActive } from "./public-nav";

describe("homeSearchHref", () => {
  it("uses the catalog helpers for each intent", () => {
    expect(homeSearchHref("buy")).toBe("/properties?status=sale");
    expect(homeSearchHref("rent")).toBe("/properties?status=rent");
    expect(homeSearchHref("offplan")).toBe("/projects");
  });

  it("passes a trimmed query through to the same hrefs", () => {
    expect(homeSearchHref("buy", "  marina ")).toBe("/properties?status=sale&q=marina");
    expect(homeSearchHref("rent", "marina")).toBe("/properties?status=rent&q=marina");
    expect(homeSearchHref("offplan", "marina")).toBe("/projects?q=marina");
  });
});

describe("isPrimaryNavActive", () => {
  it("marks Buy on the sale index and when status is omitted", () => {
    expect(isPrimaryNavActive("buy", "/properties", "sale")).toBe(true);
    expect(isPrimaryNavActive("buy", "/properties", null)).toBe(true);
    expect(isPrimaryNavActive("rent", "/properties", null)).toBe(false);
  });

  it("marks Rent only when the index is filtered to rent", () => {
    expect(isPrimaryNavActive("rent", "/properties", "rent")).toBe(true);
    expect(isPrimaryNavActive("buy", "/properties", "rent")).toBe(false);
  });

  it("does not mark Buy or Rent on a listing detail", () => {
    expect(isPrimaryNavActive("buy", "/properties/marina-view", null)).toBe(false);
    expect(isPrimaryNavActive("rent", "/properties/marina-view", "rent")).toBe(false);
  });

  it("marks Off-plan on the projects index and a project detail", () => {
    expect(isPrimaryNavActive("offplan", "/projects", null)).toBe(true);
    expect(isPrimaryNavActive("offplan", "/projects/creek-harbour", null)).toBe(true);
    expect(isPrimaryNavActive("offplan", "/properties", "sale")).toBe(false);
  });
});

describe("isCatalogIndexPath", () => {
  it("treats Buy/Rent and Off-plan indexes as catalog chrome, not detail slugs", () => {
    expect(isCatalogIndexPath("/properties")).toBe(true);
    expect(isCatalogIndexPath("/projects")).toBe(true);
    expect(isCatalogIndexPath("/properties/marina-view")).toBe(false);
    expect(isCatalogIndexPath("/projects/creek-harbour")).toBe(false);
    expect(isCatalogIndexPath("/")).toBe(false);
  });
});

describe("isSecondaryNavActive", () => {
  it("matches the section and nested paths", () => {
    expect(isSecondaryNavActive("/blog", "/blog")).toBe(true);
    expect(isSecondaryNavActive("/blog", "/blog/market-note")).toBe(true);
    expect(isSecondaryNavActive("/blog", "/contact")).toBe(false);
    expect(isSecondaryNavActive("/services", "/services")).toBe(true);
    expect(isSecondaryNavActive("/services", "/services/visa/residence")).toBe(true);
    expect(isSecondaryNavActive("/services", "/contact")).toBe(false);
  });
});
