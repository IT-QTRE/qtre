import { describe, expect, it } from "vitest";
import { clampOffset, coverScale, initialPortraitOffset, sourceCropRect } from "./portraitCrop";

describe("coverScale", () => {
  it("scales a tall photo to the frame width so the top can stay in view", () => {
    expect(coverScale(1000, 2000, 300, 400)).toBe(0.3);
  });

  it("scales a wide photo to the frame height", () => {
    expect(coverScale(2000, 1000, 300, 400)).toBe(0.4);
  });
});

describe("clampOffset", () => {
  it("keeps a covering image from sliding off the frame", () => {
    expect(clampOffset(-20, 800, 400)).toBe(-20);
    expect(clampOffset(10, 800, 400)).toBe(0);
    expect(clampOffset(-500, 800, 400)).toBe(-400);
  });
});

describe("initialPortraitOffset", () => {
  it("pins a taller-than-3:4 photo to the top", () => {
    const offset = initialPortraitOffset(1000, 2000, 300, 400);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });
});

describe("sourceCropRect", () => {
  it("maps a top-aligned cover onto image pixels", () => {
    const crop = sourceCropRect({
      imageWidth: 1000,
      imageHeight: 2000,
      frameWidth: 300,
      frameHeight: 400,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
    expect(crop.sx).toBe(0);
    expect(crop.sy).toBe(0);
    expect(crop.sw).toBeCloseTo(1000);
    expect(crop.sh).toBeCloseTo(400 / 0.3);
  });
});
