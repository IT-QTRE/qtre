import { upload } from "@vercel/blob/client";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG, requiredPathnamePrefix } from "@/convex/lib/mediaAccessConfig";
import { compressImageFile } from "./compressImage";

export type UploadedMediaFile = { url: string; pathname: string; mimeType: string };

// Shared by `MediaUploader` (entity already exists, uploads immediately) and
// the Create-page `MediaPicker` (files are staged locally and uploaded right
// after the create mutation returns a real id) — one place owns "compress,
// then hand to Vercel Blob under this entity's required pathname prefix."
// Callers still own creating the `mediaItems` row afterward (needs the
// `useMutation` hook, which can't live in a plain module function).
export async function uploadMediaFile(file: File, entityType: MediaEntityType, entityId: string): Promise<UploadedMediaFile> {
  const config = MEDIA_ACCESS_CONFIG[entityType];
  const compressed = await compressImageFile(file);
  const pathname = `${requiredPathnamePrefix(entityType, entityId)}${compressed.name}`;
  const blob = await upload(pathname, compressed, {
    access: config.access,
    handleUploadUrl: "/api/blob/upload",
    clientPayload: JSON.stringify({ entityType, entityId }),
  });
  return { url: blob.url, pathname: blob.pathname, mimeType: compressed.type };
}
