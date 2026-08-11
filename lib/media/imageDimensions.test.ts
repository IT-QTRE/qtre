import { describe, expect, it } from "vitest";
import { computeTargetDimensions } from "./imageDimensions";

describe("computeTargetDimensions", () => {
  it("leaves dimensions unchanged when already within the max", () => {
    expect(computeTargetDimensions(800, 600, 2560)).toEqual({ width: 800, height: 600 });
  });

  it("downscales a landscape image so the longest edge equals maxDimension", () => {
    expect(computeTargetDimensions(6000, 4000, 2560)).toEqual({ width: 2560, height: 1707 });
  });

  it("downscales a portrait image so the longest edge equals maxDimension", () => {
    expect(computeTargetDimensions(4000, 6000, 2560)).toEqual({ width: 1707, height: 2560 });
  });

  it("never upscales", () => {
    expect(computeTargetDimensions(400, 300, 2560)).toEqual({ width: 400, height: 300 });
  });
});
