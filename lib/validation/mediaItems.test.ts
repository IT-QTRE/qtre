import { describe, expect, it } from "vitest";
import { mediaItemSchema } from "./mediaItems";
import { mediaEntityTypeValidator } from "../../convex/lib/mediaEntityType";

describe("mediaItemSchema", () => {
  it("restricts entityType to the same union Convex defines", () => {
    const kinds = mediaEntityTypeValidator.members.map((m) => m.value as string);
    for (const entityType of kinds) {
      expect(
        mediaItemSchema.safeParse({
          entityType,
          entityId: "some-id",
          url: "https://example.com/x.png",
          pathname: "x/x.png",
          order: 0,
          mimeType: "image/png",
        }).success,
      ).toBe(true);
    }
    expect(mediaItemSchema.safeParse({ entityType: "invoice" }).success).toBe(false);
  });
});
