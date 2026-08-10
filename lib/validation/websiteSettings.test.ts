import { describe, expect, it } from "vitest";
import { websiteSettingsSchema } from "./websiteSettings";

describe("websiteSettingsSchema", () => {
  it("requires siteName, validates nested socialLinks as URLs", () => {
    expect(websiteSettingsSchema.safeParse({ siteName: "QuickTalk Real Estate" }).success).toBe(true);
    expect(
      websiteSettingsSchema.safeParse({
        siteName: "QuickTalk Real Estate",
        socialLinks: { instagram: "not-a-url" },
      }).success,
    ).toBe(false);
  });
});
