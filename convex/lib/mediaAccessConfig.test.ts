import { describe, expect, it } from "vitest";
import { MEDIA_ACCESS_CONFIG, requiredPathnamePrefix } from "./mediaAccessConfig";

describe("MEDIA_ACCESS_CONFIG", () => {
  it("marks propertySubmission as private with images+PDF allowed", () => {
    expect(MEDIA_ACCESS_CONFIG.propertySubmission.access).toBe("private");
    expect(MEDIA_ACCESS_CONFIG.propertySubmission.allowedContentTypes).toContain("application/pdf");
  });

  it("marks every marketing entity type as public, images-only", () => {
    for (const entityType of ["property", "project", "developer", "agent", "community", "blogPost"] as const) {
      expect(MEDIA_ACCESS_CONFIG[entityType].access).toBe("public");
      expect(MEDIA_ACCESS_CONFIG[entityType].allowedContentTypes).not.toContain("application/pdf");
    }
  });
});

describe("requiredPathnamePrefix", () => {
  it("binds entityType and entityId into the required prefix, so two different entities never share a prefix", () => {
    const mine = requiredPathnamePrefix("propertySubmission", "my-submission-id");
    const someoneElses = requiredPathnamePrefix("propertySubmission", "their-submission-id");
    expect(mine).toBe("propertySubmission/my-submission-id/");
    expect(someoneElses).not.toBe(mine);
    expect(`${someoneElses}deed.pdf`.startsWith(mine)).toBe(false);
  });
});
