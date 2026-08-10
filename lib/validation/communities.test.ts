import { describe, expect, it } from "vitest";
import { communitySchema } from "./communities";

describe("communitySchema", () => {
  it("requires countryCode as a 2-letter uppercase code", () => {
    const base = {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      publishing: { slug: "dubai-marina", status: "published", updatedAt: Date.now() },
    };
    expect(communitySchema.safeParse({ ...base, countryCode: "AE" }).success).toBe(true);
    expect(communitySchema.safeParse({ ...base, countryCode: "ae" }).success).toBe(false);
  });
});
