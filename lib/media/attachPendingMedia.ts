import { uploadMediaFile } from "./uploadMediaFile";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";

export type PendingUpload = { file: File; previewUrl: string };

type CreateMediaItem = (args: {
  entityType: MediaEntityType;
  entityId: string;
  url: string;
  pathname: string;
  mimeType: string;
  order: number;
}) => Promise<unknown>;

// Uploads can finish in any order; `mediaItems.create` used to stamp
// `order` from whichever mutation landed first, which shuffled cover on
// create. Blob uploads stay parallel; rows are written in picker order.
export async function attachPendingMedia(
  pending: PendingUpload[],
  entityType: MediaEntityType,
  entityId: string,
  createItem: CreateMediaItem,
): Promise<number> {
  const results = await Promise.allSettled(
    pending.map(async (item, index) => {
      const uploaded = await uploadMediaFile(item.file, entityType, entityId);
      return { item, uploaded, index };
    }),
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { item, uploaded, index } = result.value;
    await createItem({ entityType, entityId, ...uploaded, order: index });
    URL.revokeObjectURL(item.previewUrl);
  }

  return results.filter((result) => result.status === "rejected").length;
}
