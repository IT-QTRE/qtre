import { describe, expect, it } from "vitest";
import { safeGhlFormUrl } from "./ghl-form-url";

describe("safeGhlFormUrl", () => {
  it("accepts https LeadConnector widget URLs", () => {
    expect(safeGhlFormUrl("https://api.leadconnectorhq.com/widget/form/abc123")).toBe(
      "https://api.leadconnectorhq.com/widget/form/abc123",
    );
  });

  it("accepts msgsndr, gohighlevel, and the QTRE white-label host", () => {
    expect(safeGhlFormUrl("https://link.msgsndr.com/widget/form/xyz")).toContain("msgsndr.com");
    expect(safeGhlFormUrl("https://forms.gohighlevel.com/form/xyz")).toContain("gohighlevel.com");
    expect(safeGhlFormUrl("https://go.quicktalkbusiness.com/widget/form/YyKpLuPKx9HKTNeonl8u")).toBe(
      "https://go.quicktalkbusiness.com/widget/form/YyKpLuPKx9HKTNeonl8u",
    );
  });

  it("rejects empty, http, other hosts, and non-URLs", () => {
    expect(safeGhlFormUrl("")).toBeNull();
    expect(safeGhlFormUrl(undefined)).toBeNull();
    expect(safeGhlFormUrl("http://api.leadconnectorhq.com/widget/form/abc")).toBeNull();
    expect(safeGhlFormUrl("https://evil.example/widget/form/abc")).toBeNull();
    expect(safeGhlFormUrl("https://www.quicktalkbusiness.com/about")).toBeNull();
    expect(safeGhlFormUrl("javascript:alert(1)")).toBeNull();
    expect(safeGhlFormUrl("not a url")).toBeNull();
  });

  it("extracts the widget src from a GHL iframe snippet", () => {
    const snippet = `<iframe
    src="https://go.quicktalkbusiness.com/widget/form/YyKpLuPKx9HKTNeonl8u"
    title="QTRE Web Form"></iframe>
<script src="https://go.quicktalkbusiness.com/js/form_embed.js"></script>`;
    expect(safeGhlFormUrl(snippet)).toBe(
      "https://go.quicktalkbusiness.com/widget/form/YyKpLuPKx9HKTNeonl8u",
    );
  });

  it("rejects the embed script by itself", () => {
    expect(safeGhlFormUrl("https://link.msgsndr.com/js/form_embed.js")).toBeNull();
    expect(safeGhlFormUrl("https://go.quicktalkbusiness.com/js/form_embed.js")).toBeNull();
  });

  it("rejects credentials in the URL", () => {
    expect(safeGhlFormUrl("https://user:pass@api.leadconnectorhq.com/widget/form/abc")).toBeNull();
  });
});
