import { describe, expect, it } from "vitest";
import { siteUrl } from "./site";
import { sanitizeBlogHtml } from "./sanitize-blog-html";

describe("sanitizeBlogHtml", () => {
  it("keeps internal paths same-tab", () => {
    const html = sanitizeBlogHtml('<p><a href="/properties/marina-unit-101">Marina</a></p>');
    expect(html).toContain('href="/properties/marina-unit-101"');
    expect(html).not.toContain("target=");
    expect(html).not.toContain("rel=");
  });

  it("keeps same-origin URLs same-tab", () => {
    const html = sanitizeBlogHtml(`<p><a href="${siteUrl}/blog/market-note">Note</a></p>`);
    expect(html).toContain(`href="${siteUrl}/blog/market-note"`);
    expect(html).not.toContain("target=");
  });

  it("opens external URLs in a new tab", () => {
    const html = sanitizeBlogHtml('<p><a href="https://example.com">Example</a></p>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
