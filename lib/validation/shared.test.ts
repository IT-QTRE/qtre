import { describe, expect, it } from "vitest";
import { localizedTextSchema, optionalEmailSchema, optionalUrlSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

describe("localizedTextSchema", () => {
  it("requires en, allows optional ar/tr", () => {
    expect(localizedTextSchema.safeParse({ en: "Hello" }).success).toBe(true);
    expect(localizedTextSchema.safeParse({ ar: "مرحبا" }).success).toBe(false);
  });
});

describe("seoFieldsSchema", () => {
  it("is fully optional", () => {
    expect(seoFieldsSchema.safeParse({}).success).toBe(true);
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
