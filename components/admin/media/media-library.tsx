"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";
import { deleteMediaItem } from "@/lib/actions/media";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type PublicMediaEntityType = Exclude<MediaEntityType, "propertySubmission">;

export const PUBLIC_ENTITY_TYPES = (Object.keys(MEDIA_ACCESS_CONFIG) as MediaEntityType[]).filter(
  (type): type is PublicMediaEntityType => MEDIA_ACCESS_CONFIG[type].access === "public",
);

export const ENTITY_TYPE_LABEL: Record<PublicMediaEntityType, string> = {
  property: "Property",
  project: "Project",
  developer: "Developer",
  agent: "Agent",
  community: "Community",
  blogPost: "Post",
};

const ENTITY_TYPE_ROUTES: Record<PublicMediaEntityType, string> = {
  property: "/admin/properties",
  project: "/admin/projects",
  developer: "/admin/developers",
  agent: "/admin/agents",
  community: "/admin/communities",
  blogPost: "/admin/blog",
};

export type MediaLibraryItem = {
  _id: Id<"mediaItems">;
  url: string;
  entityType: MediaEntityType;
  entityId: string;
  mimeType: string;
  entityLabel: string | null;
};

function MediaLibraryCard({
  item,
  priority,
  onRequestDelete,
}: {
  item: MediaLibraryItem;
  priority?: boolean;
  onRequestDelete: (item: MediaLibraryItem) => void;
}) {
  const publicType = item.entityType as PublicMediaEntityType;
  const typeLabel = ENTITY_TYPE_LABEL[publicType];
  const entityHref = `${ENTITY_TYPE_ROUTES[publicType]}/${item.entityId}`;
  const caption = item.entityLabel || typeLabel;
  const openLabel = item.entityLabel ? `Open ${item.entityLabel}` : `Open ${typeLabel.toLowerCase()}`;
  const deleteLabel = item.entityLabel ? `Delete photo of ${item.entityLabel}` : `Delete ${typeLabel.toLowerCase()} photo`;

  return (
    <div className="min-w-0 [content-visibility:auto] [contain-intrinsic-size:auto_10rem]">
      <div className="group relative">
        <Link
          href={entityHref}
          aria-label={openLabel}
          className="relative block aspect-square overflow-hidden border border-border bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <MediaImage
            mediaItemId={item._id}
            url={item.url}
            entityType={item.entityType}
            mimeType={item.mimeType}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 12vw, (min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
            priority={priority}
          />
        </Link>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={deleteLabel}
          className="absolute inset-e-1 top-1 z-10 size-11 touch-manipulation opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
          onClick={() => onRequestDelete(item)}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground" title={caption}>
        {caption}
      </p>
    </div>
  );
}

export function MediaLibraryGrid({ items }: { items: MediaLibraryItem[] }) {
  const [pending, setPending] = useState<MediaLibraryItem | null>(null);
  const [isPending, startDeleteTransition] = useTransition();
  const pendingType =
    pending && pending.entityType !== "propertySubmission"
      ? ENTITY_TYPE_LABEL[pending.entityType]
      : "record";

  return (
    <>
      <ul className="grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {items.map((item, index) => (
          <li key={item._id}>
            <MediaLibraryCard item={item} priority={index < 8} onRequestDelete={setPending} />
          </li>
        ))}
      </ul>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.entityLabel ? `Delete photo of ${pending.entityLabel}?` : "Delete this photo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear from the {pendingType.toLowerCase()} it belongs to. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep photo</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending || !pending}
              onClick={() => {
                const item = pending;
                if (!item) return;
                startDeleteTransition(async () => {
                  try {
                    await deleteMediaItem(item._id);
                    toast.success("Photo deleted");
                    setPending(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not delete this photo. Try again.");
                  }
                });
              }}
            >
              {isPending ? "Deleting…" : "Delete photo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function MediaLibrarySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8" aria-hidden>
      {Array.from({ length: 16 }, (_, index) => (
        <div key={index} className="space-y-2">
          <div className="aspect-square bg-muted" />
          <div className="h-3 w-16 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function MediaLoadMore({
  canLoadMore,
  isLoadingMore,
  onLoadMore,
}: {
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (!canLoadMore && !isLoadingMore) return null;

  return (
    <div className="flex justify-end">
      <Button variant="outline" className="min-h-11" disabled={isLoadingMore} onClick={onLoadMore}>
        {isLoadingMore ? "Loading more photos…" : "Load more"}
      </Button>
    </div>
  );
}
