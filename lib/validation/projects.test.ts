import { describe, expect, it } from "vitest";
import { projectSchema } from "./projects";

describe("projectSchema", () => {
  it("accepts an optional Q4-style completion date", () => {
    const base = {
      title: { en: "Marina Heights" },
      description: { en: "A waterfront tower." },
      developerId: "some-developer-id",
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      publishing: { slug: "marina-heights", status: "published", updatedAt: Date.now() },
    };
    expect(projectSchema.safeParse({ ...base, completionDate: { quarter: 4, year: 2027 } }).success).toBe(true);
    expect(projectSchema.safeParse({ ...base, completionDate: { quarter: 5, year: 2027 } }).success).toBe(false);
  });

  it("requires a developerId but not a communityId", () => {
    const base = {
      title: { en: "Marina Heights" },
      description: { en: "A waterfront tower." },
      developerId: "some-developer-id",
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      publishing: { slug: "marina-heights", status: "published", updatedAt: Date.now() },
    };
    expect(projectSchema.safeParse(base).success).toBe(true);
    const { developerId: _developerId, ...missingDeveloper } = base;
    expect(projectSchema.safeParse(missingDeveloper).success).toBe(false);
  });
});
