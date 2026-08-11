"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { deleteMediaItem } from "@/lib/actions/media";
import { MediaImage } from "./media-image";

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
  const items = useQuery(api.mediaItems.listByEntity, { entityType, entityId }) ?? EMPTY_MEDIA_ITEMS;
  const createMediaItem = useMutation(api.mediaItems.create);
  const reorderMediaItems = useMutation(api.mediaItems.reorder);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startDeleteTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = MEDIA_ACCESS_CONFIG[entityType];
  // Without an activation distance, @dnd-kit's PointerSensor can treat the
  // tiny hand-tremor movement that happens during an ordinary click as a
  // drag start, swallowing clicks on interactive descendants (the Remove
  // button, the private-document "View document" link) — this is the
  // library's own documented fix for sortable lists with clickable items.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError(null);
      setIsUploading(true);
      try {
        for (const rawFile of Array.from(files)) {
          const uploaded = await uploadMediaFile(rawFile, entityType, entityId);
          await createMediaItem({ entityType, entityId, ...uploaded });
        }
      } catch (uploadError) {
        setError((uploadError as Error).message);
      } finally {
        setIsUploading(false);
      }
    },
    [createMediaItem, entityId, entityType],
  );

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
        {isUploading ? "Uploading…" : "Drop files here or click to upload"}
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
      {error && <p className="text-sm text-destructive">{error}</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item._id)} strategy={verticalListSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item) => (
              <SortableMediaItem key={item._id} item={item} onDelete={handleDelete} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableMediaItem({
  item,
  onDelete,
}: {
  item: { _id: Id<"mediaItems">; url: string; pathname: string; entityType: MediaEntityType; mimeType: string };
  onDelete: (id: Id<"mediaItems">) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
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
        />
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(item._id);
        }}
        className="absolute right-1 top-1 z-10 rounded-full bg-background/80 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
      >
        Remove
      </button>
    </li>
  );
}
