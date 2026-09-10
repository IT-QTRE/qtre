import { uploadMediaFile } from "./uploadMediaFile";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";

export type PendingUpload = { file: File; previewUrl: string };

type CreateMediaItem = (args: {
  entityType: MediaEntityType;
  entityId: string;
  url: string;
  pathname: string;
  mimeType: string;
}) => Promise<unknown>;

// Uploads can finish in any order; `mediaItems.create` stamps `order` from
// whichever row is written first. Blob uploads stay parallel; rows are
// written in picker order so cover stays the first thumbnail.
export async function attachPendingMedia(
  pending: PendingUpload[],
  entityType: MediaEntityType,
  entityId: string,
  createItem: CreateMediaItem,
): Promise<number> {
  const results = await Promise.allSettled(
    pending.map(async (item) => {
      const uploaded = await uploadMediaFile(item.file, entityType, entityId);
      return { item, uploaded };
    }),
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { item, uploaded } = result.value;
    await createItem({ entityType, entityId, ...uploaded });
    URL.revokeObjectURL(item.previewUrl);
  }

  return results.filter((result) => result.status === "rejected").length;
}
