import { describe, expect, it } from "vitest";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

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
