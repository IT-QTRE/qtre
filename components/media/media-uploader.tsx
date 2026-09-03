"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { usesPortraitCrop } from "@/lib/media/portraitCrop";
import { deleteMediaItem } from "@/lib/actions/media";
import { useAuthedQuery } from "@/components/admin/use-authed-query";
import { MediaImage } from "./media-image";
import { PortraitCropDialog } from "./portrait-crop-dialog";

type MediaUploaderProps = {
  entityType: MediaEntityType;
  entityId: string;
};

// Stable reference for the "still loading" fallback — `?? []` inline would
// create a new array every render, defeating useCallback's dependency
// check below while the query is loading (Vercel's React best-practices
// guidance: hoist non-primitive default values to a module-level constant).
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
  // Without an activation distance, @dnd-kit's PointerSensor can treat the
  // tiny hand-tremor movement that happens during an ordinary click as a
  // drag start, swallowing clicks on interactive descendants (the Remove
  // button, the private-document "View document" link) — this is the
  // library's own documented fix for sortable lists with clickable items.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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
      if (usesPortraitCrop(entityType)) {
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
    [entityType, uploadOne],
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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
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
    <div className="space-y-4">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length) void handleFiles(event.dataTransfer.files);
        }}
        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? "Uploading…" : usesPortraitCrop(entityType) ? "Drop a portrait or click to add" : "Drop photos here or click to add"}
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
      {usesPortraitCrop(entityType) ? (
        <p className="text-xs text-muted-foreground">
          You'll frame a 3:4 portrait next — keep the head at the top, head to shoulders or chest.
        </p>
      ) : null}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item._id)} strategy={verticalListSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item, index) => (
              <SortableMediaItem
                key={item._id}
                item={item}
                isCover={index === 0}
                portrait={usesPortraitCrop(entityType)}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <PortraitCropDialog
        file={cropQueue[0] ?? null}
        remainingCount={Math.max(0, cropQueue.length - 1)}
        onConfirm={confirmCrop}
        onSkip={() => setCropQueue((current) => current.slice(1))}
      />
    </div>
  );
}

function SortableMediaItem({
  item,
  isCover,
  portrait,
  onDelete,
}: {
  item: { _id: Id<"mediaItems">; url: string; pathname: string; entityType: MediaEntityType; mimeType: string };
  isCover: boolean;
  portrait: boolean;
  onDelete: (id: Id<"mediaItems">) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={portrait ? "relative aspect-3/4 overflow-hidden rounded-lg border border-border" : "relative aspect-square overflow-hidden rounded-lg border border-border"}
    >
      {/* Drag listeners are scoped to this inner layer (not the whole <li>)
          so interactive descendants — the Remove button below, and the
          private-document "View document" link inside MediaImage — keep
          receiving their own click events instead of having pointerdown
          captured by @dnd-kit's sensor first. */}
      <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing">
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
      </div>
      {isCover ? (
        <span className="pointer-events-none absolute bottom-1 left-1 z-10 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium">
          Cover
        </span>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(item._id);
        }}
        className="absolute right-1 top-1 z-10 rounded-full bg-background/90 px-2.5 py-1.5 text-xs shadow-sm"
      >
        Remove
      </button>
    </li>
  );
}
