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
    expect(
      websiteSettingsSchema.safeParse({
        siteName: "QuickTalk Real Estate",
        contactFormUrl: "https://go.quicktalkbusiness.com/widget/form/YyKpLuPKx9HKTNeonl8u",
      }).success,
    ).toBe(true);
    expect(
      websiteSettingsSchema.safeParse({
        siteName: "QuickTalk Real Estate",
        contactFormUrl: "https://evil.example/form",
      }).success,
    ).toBe(false);
    expect(
      websiteSettingsSchema.safeParse({
        siteName: "QuickTalk Real Estate",
        contactWhatsapp: "+971 50 123 4567",
      }).success,
    ).toBe(true);
    expect(
      websiteSettingsSchema.safeParse({
        siteName: "QuickTalk Real Estate",
        contactWhatsapp: "123",
      }).success,
    ).toBe(false);
  });
});
