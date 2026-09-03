import { describe, expect, it } from "vitest";
import { compactSeoFields, localizedTextSchema, optionalEmailSchema, optionalUrlSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

describe("localizedTextSchema", () => {
  it("requires en, allows optional ar/tr", () => {
    expect(localizedTextSchema.safeParse({ en: "Hello" }).success).toBe(true);
    expect(localizedTextSchema.safeParse({ ar: "مرحبا" }).success).toBe(false);
  });

  it("treats blank ar/tr form inputs as omitted, not required", () => {
    expect(localizedTextSchema.safeParse({ en: "Hello", ar: "", tr: "" }).success).toBe(true);
  });
});

describe("seoFieldsSchema", () => {
  it("is fully optional", () => {
    expect(seoFieldsSchema.safeParse({}).success).toBe(true);
  });

  it("treats blank registered inputs as omitted, not invalid", () => {
    expect(seoFieldsSchema.safeParse({ seoTitle: { en: "" }, seoDescription: { en: "" }, canonicalPath: "" }).success).toBe(
      true,
    );
    expect(seoFieldsSchema.safeParse({ seoTitle: {} }).success).toBe(true);
  });

  it("requires English when a translation is present", () => {
    const result = seoFieldsSchema.safeParse({ seoTitle: { ar: "عنوان" } });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("English is required if you add a translation");
    }
  });
});

describe("compactSeoFields", () => {
  it("drops blank SEO so the payload omits the block", () => {
    expect(compactSeoFields({ seoTitle: { en: "" }, seoDescription: { en: "" }, canonicalPath: "" })).toBeUndefined();
    expect(compactSeoFields({ seoTitle: { en: "  Marina Heights  " } })).toEqual({
      seoTitle: { en: "Marina Heights" },
      seoDescription: undefined,
      canonicalPath: undefined,
    });
  });
});

describe("publishingFieldsSchema", () => {
  it("requires slug/status/updatedAt, restricts status to the three known values", () => {
    expect(
      publishingFieldsSchema.safeParse({ slug: "x", status: "draft", updatedAt: Date.now() }).success,
    ).toBe(true);
    expect(
      publishingFieldsSchema.safeParse({ slug: "x", status: "live", updatedAt: Date.now() }).success,
    ).toBe(false);
  });
});

describe("optionalEmailSchema", () => {
  it("accepts undefined and an empty string (a cleared optional input), rejects a malformed address", () => {
    expect(optionalEmailSchema.safeParse(undefined).success).toBe(true);
    expect(optionalEmailSchema.safeParse("").success).toBe(true);
    expect(optionalEmailSchema.safeParse("jane@example.com").success).toBe(true);
    expect(optionalEmailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("optionalUrlSchema", () => {
  it("accepts undefined and an empty string (a cleared optional input), rejects a malformed URL", () => {
    expect(optionalUrlSchema.safeParse(undefined).success).toBe(true);
    expect(optionalUrlSchema.safeParse("").success).toBe(true);
    expect(optionalUrlSchema.safeParse("https://example.com").success).toBe(true);
    expect(optionalUrlSchema.safeParse("not-a-url").success).toBe(false);
  });
});
