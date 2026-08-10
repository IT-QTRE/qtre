import { describe, expect, it } from "vitest";
import { mediaEntityTypeValidator } from "./mediaEntityType";

describe("mediaEntityTypeValidator", () => {
  it("covers every entity that can carry attached media", () => {
    const kinds = mediaEntityTypeValidator.members.map((m) => m.value);
    expect(kinds.sort()).toEqual(
      ["agent", "blogPost", "community", "developer", "project", "property", "propertySubmission"].sort(),
    );
  });
});
