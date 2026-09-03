import type { MediaEntityType } from "@/convex/lib/mediaEntityType";

export const PORTRAIT_ASPECT = 3 / 4;
export const PORTRAIT_OUTPUT_HEIGHT = 1600;

export function usesPortraitCrop(entityType: MediaEntityType) {
  return entityType === "agent";
}

export function coverScale(imageWidth: number, imageHeight: number, frameWidth: number, frameHeight: number) {
  return Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
}

export function clampOffset(offset: number, displayed: number, frame: number) {
  if (displayed <= frame) return (frame - displayed) / 2;
  return Math.min(0, Math.max(frame - displayed, offset));
}

export function displayedSize(imageWidth: number, imageHeight: number, frameWidth: number, frameHeight: number, zoom: number) {
  const scale = coverScale(imageWidth, imageHeight, frameWidth, frameHeight) * zoom;
  return { scale, width: imageWidth * scale, height: imageHeight * scale };
}

export function initialPortraitOffset(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  zoom = 1,
) {
  const { width, height } = displayedSize(imageWidth, imageHeight, frameWidth, frameHeight, zoom);
  return {
    x: clampOffset((frameWidth - width) / 2, width, frameWidth),
    // Top-aligned so the head stays in frame on a tall photo.
    y: clampOffset(0, height, frameHeight),
  };
}

export function sourceCropRect({
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight,
  zoom,
  offsetX,
  offsetY,
}: {
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
}) {
  const { scale, width, height } = displayedSize(imageWidth, imageHeight, frameWidth, frameHeight, zoom);
  const x = clampOffset(offsetX, width, frameWidth);
  const y = clampOffset(offsetY, height, frameHeight);
  return {
    sx: -x / scale,
    sy: -y / scale,
    sw: frameWidth / scale,
    sh: frameHeight / scale,
  };
}

export async function cropImageFile(
  file: File,
  crop: { sx: number; sy: number; sw: number; sh: number },
  outputHeight = PORTRAIT_OUTPUT_HEIGHT,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const outputWidth = Math.round(outputHeight * PORTRAIT_ASPECT);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outputWidth, outputHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) return file;
  const stem = file.name.replace(/\.[^.]+$/, "") || "portrait";
  return new File([blob], `${stem}.jpg`, { type: "image/jpeg" });
}
