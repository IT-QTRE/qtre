import { describe, expect, it } from "vitest";
import { publishingFieldsValidator, seoFieldsValidator } from "./seoFields";

describe("seoFieldsValidator", () => {
  it("has only optional fields", () => {
    expect(seoFieldsValidator.fields.seoTitle.isOptional).toBe("optional");
    expect(seoFieldsValidator.fields.seoDescription.isOptional).toBe("optional");
    expect(seoFieldsValidator.fields.canonicalPath.isOptional).toBe("optional");
  });
});

describe("publishingFieldsValidator", () => {
  it("requires slug/status/updatedAt but not publishedAt", () => {
    expect(publishingFieldsValidator.fields.slug.isOptional).toBe("required");
    expect(publishingFieldsValidator.fields.status.isOptional).toBe("required");
    expect(publishingFieldsValidator.fields.updatedAt.isOptional).toBe("required");
    expect(publishingFieldsValidator.fields.publishedAt.isOptional).toBe("optional");
  });
});
