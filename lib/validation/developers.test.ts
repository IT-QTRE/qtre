import { describe, expect, it } from "vitest";
import { developerSchema } from "./developers";

describe("developerSchema", () => {
  it("requires a localized name and publishing block, everything else optional", () => {
    expect(
      developerSchema.safeParse({
        name: { en: "Emaar Properties" },
        publishing: { slug: "emaar-properties", status: "published", updatedAt: Date.now() },
      }).success,
    ).toBe(true);
    expect(developerSchema.safeParse({ publishing: { slug: "x", status: "published", updatedAt: 1 } }).success).toBe(
      false,
    );
  });
});
