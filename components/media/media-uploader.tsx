"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { usesPortraitCrop } from "@/lib/media/portraitCrop";
import { moveItemById } from "@/lib/media/reorderMedia";
import { deleteMediaItem } from "@/lib/actions/media";
import { useAuthedQuery } from "@/components/admin/use-authed-query";
import { MediaImage } from "./media-image";
import { PortraitCropDialog } from "./portrait-crop-dialog";
import { MediaFileDrop, MediaSortContext, SortableMediaItem } from "./sortable-media-grid";

type MediaUploaderProps = {
  entityType: MediaEntityType;
  entityId: string;
};

const EMPTY_MEDIA_ITEMS: never[] = [];

export function MediaUploader({ entityType, entityId }: MediaUploaderProps) {
  const items = useAuthedQuery(api.mediaItems.listByEntity, { entityType, entityId }) ?? EMPTY_MEDIA_ITEMS;
  const createMediaItem = useMutation(api.mediaItems.create);
  const reorderMediaItems = useMutation(api.mediaItems.reorder);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [, startDeleteTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = MEDIA_ACCESS_CONFIG[entityType];
  const portrait = usesPortraitCrop(entityType);

  const uploadOne = useCallback(
    async (file: File) => {
      const uploaded = await uploadMediaFile(file, entityType, entityId);
      await createMediaItem({ entityType, entityId, ...uploaded });
    },
    [createMediaItem, entityId, entityType],
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      const list = Array.from(files);
      setError(null);
      if (portrait) {
        setCropQueue((current) => [...current, ...list.filter((file) => file.type.startsWith("image/"))]);
        return;
      }
      setIsUploading(true);
      try {
        for (const rawFile of list) {
          await uploadOne(rawFile);
        }
      } catch (uploadError) {
        setError((uploadError as Error).message);
      } finally {
        setIsUploading(false);
      }
    },
    [portrait, uploadOne],
  );

  async function confirmCrop(cropped: File) {
    setError(null);
    setIsUploading(true);
    try {
      await uploadOne(cropped);
      setCropQueue((current) => current.slice(1));
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setIsUploading(false);
    }
  }

  const handleReorder = useCallback(
    (fromId: string, toId: string) => {
      const reordered = moveItemById(items, fromId, toId, (item) => item._id);
      if (!reordered) return;
      void reorderMediaItems({ entityType, entityId, orderedIds: reordered.map((item) => item._id) });
    },
    [entityId, entityType, items, reorderMediaItems],
  );

  const handleDelete = useCallback((mediaItemId: Id<"mediaItems">) => {
    startDeleteTransition(async () => {
      await deleteMediaItem(mediaItemId);
    });
  }, []);

  return (
    <MediaFileDrop onFiles={(files) => void handleFiles(files)}>
      <div
        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? "Uploading…" : portrait ? "Drop a portrait or click to add" : "Drop photos here or click to add"}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={config.allowedContentTypes.join(",")}
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {portrait ? (
        <p className="text-xs text-muted-foreground">
          You'll frame a 3:4 portrait next — keep the head at the top, head to shoulders or chest.
        </p>
      ) : null}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <MediaSortContext items={items.map((item) => item._id)} onReorder={handleReorder}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item, index) => (
            <SortableMediaItem
              key={item._id}
              id={item._id}
              isCover={index === 0}
              portrait={portrait}
              onDelete={() => handleDelete(item._id)}
            >
              <MediaImage
                mediaItemId={item._id}
                url={item.url}
                entityType={item.entityType}
                mimeType={item.mimeType}
                alt=""
                fill
                sizes="200px"
                className={portrait ? "object-cover object-top" : "object-cover"}
              />
            </SortableMediaItem>
          ))}
        </ul>
      </MediaSortContext>
      <PortraitCropDialog
        file={cropQueue[0] ?? null}
        remainingCount={Math.max(0, cropQueue.length - 1)}
        onConfirm={confirmCrop}
        onSkip={() => setCropQueue((current) => current.slice(1))}
      />
    </MediaFileDrop>
  );
}
