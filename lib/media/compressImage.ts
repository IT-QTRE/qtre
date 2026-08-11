import { computeTargetDimensions } from "./imageDimensions";

const DEFAULT_MAX_DIMENSION = 2560;
const DEFAULT_QUALITY = 0.82;

// Resizes + re-encodes an image file to WebP entirely client-side, so large
// phone/DSLR photos never hit the network (or Blob storage) at their
// original size. Falls back to the original file untouched if the input
// isn't an image, or if the browser can't produce a WebP blob (very old
// browsers) — never blocks an upload on this being unsupported.
export async function compressImageFile(
  file: File,
  { maxDimension = DEFAULT_MAX_DIMENSION, quality = DEFAULT_QUALITY } = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = computeTargetDimensions(bitmap.width, bitmap.height, maxDimension);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob) {
      return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    // Any failure (unsupported format, decode error, etc.) falls back to
    // uploading the original — never block the user's upload on this.
    return file;
  }
}
