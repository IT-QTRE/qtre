import { describe, expect, it } from "vitest";
import { moveItemById } from "./reorderMedia";

describe("moveItemById", () => {
  const photos = [{ id: "cover" }, { id: "living" }, { id: "kitchen" }, { id: "view" }];

  it("makes a later photo the cover when dropped on the first slot", () => {
    const next = moveItemById(photos, "view", "cover", (photo) => photo.id);
    expect(next?.map((photo) => photo.id)).toEqual(["view", "cover", "living", "kitchen"]);
  });

  it("does nothing when the photo is dropped on itself", () => {
    expect(moveItemById(photos, "cover", "cover", (photo) => photo.id)).toBeNull();
  });
});
