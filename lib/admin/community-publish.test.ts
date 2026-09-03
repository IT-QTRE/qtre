import { describe, expect, it } from "vitest";
import { communityPublishNotes } from "./community-publish";

describe("communityPublishNotes", () => {
  const base = {
    name: { en: "Marina" },
    city: { en: "Dubai" },
    description: { en: "A marina" },
  };

  it("is empty when English copy and a photo exist", () => {
    expect(communityPublishNotes({ ...base, photoCount: 1 })).toEqual(["Arabic is empty.", "Turkish is empty."]);
  });

  it("warns when the place would go live without a hero or about", () => {
    expect(
      communityPublishNotes({
        photoCount: 0,
        name: { en: "Marina" },
        city: { en: "Dubai" },
      }),
    ).toEqual([
      "No photos yet — the place page will go live without a hero.",
      "No description yet — the place page will go live without an about section.",
      "Arabic is empty.",
      "Turkish is empty.",
    ]);
  });
});
