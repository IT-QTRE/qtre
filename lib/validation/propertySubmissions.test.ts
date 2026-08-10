import { describe, expect, it } from "vitest";
import { propertySubmissionSchema } from "./propertySubmissions";

describe("propertySubmissionSchema", () => {
  it("uses plain string title/description/city, unlike propertySchema's LocalizedText", () => {
    const valid = {
      price: 1_800_000,
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 1200,
      countryCode: "AE",
      title: "My apartment in JBR",
      description: "Sea view, high floor.",
      city: "Dubai",
    };
    expect(propertySubmissionSchema.safeParse(valid).success).toBe(true);
    expect(propertySubmissionSchema.safeParse({ ...valid, title: { en: "not a string" } }).success).toBe(
      false,
    );
  });

  it("does not require staff-only fields like status or assignedReviewerId", () => {
    const valid = {
      price: 1,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 1,
      countryCode: "AE",
      title: "x",
      description: "x",
      city: "x",
    };
    const result = propertySubmissionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
