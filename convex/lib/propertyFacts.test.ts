import { describe, expect, it } from "vitest";
import { propertySharedFactsValidator } from "./propertyFacts";

describe("propertySharedFactsValidator", () => {
  it("only contains facts that are identical in shape for an owner submission and an admin-curated listing", () => {
    expect(Object.keys(propertySharedFactsValidator.fields).sort()).toEqual(
      ["areaSqft", "bathrooms", "bedrooms", "countryCode", "price"].sort(),
    );
  });
});
