import { describe, expect, it } from "vitest";
import { emptyFormLocalized, formLocalized, formSeo } from "./form-values";

describe("formLocalized", () => {
  it("fills blank locale tabs so a mounted field matches the saved document", () => {
    expect(formLocalized({ en: "Sara" })).toEqual({ en: "Sara", ar: "", tr: "" });
    expect(formLocalized(undefined)).toEqual(emptyFormLocalized());
  });
});

describe("formSeo", () => {
  it("fills blank SEO so register() on canonical path is not a dirty edit", () => {
    expect(formSeo(undefined)).toEqual({
      seoTitle: { en: "", ar: "", tr: "" },
      seoDescription: { en: "", ar: "", tr: "" },
      canonicalPath: "",
    });
  });
});
