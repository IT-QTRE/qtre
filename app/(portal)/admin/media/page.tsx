"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";
import { deleteMediaItem } from "@/lib/actions/media";
import { MediaImage } from "@/components/media/media-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type PublicMediaEntityType = Exclude<MediaEntityType, "propertySubmission">;

const PUBLIC_ENTITY_TYPES = Object.entries(MEDIA_ACCESS_CONFIG)
  .filter(([, cfg]) => cfg.access === "public")
  .map(([type]) => type as PublicMediaEntityType);

const ENTITY_TYPE_ROUTES: Record<PublicMediaEntityType, string> = {
  property: "/admin/properties",
  project: "/admin/projects",
  developer: "/admin/developers",
  agent: "/admin/agents",
  community: "/admin/communities",
  blogPost: "/admin/blog",
};

function formatEntityTypeLabel(entityType: string): string {
  return entityType
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

type MediaLibraryCardProps = {
  item: {
    _id: Id<"mediaItems">;
    url: string;
    entityType: MediaEntityType;
    entityId: string;
    mimeType: string;
  };
};

function MediaLibraryCard({ item }: MediaLibraryCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startDeleteTransition] = useTransition();
  // listAllPaginated never returns propertySubmission rows.
  const publicType = item.entityType as PublicMediaEntityType;
  const entityHref = `${ENTITY_TYPE_ROUTES[publicType]}/${item.entityId}`;

  return (
    <div className="space-y-2">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
        <div className="absolute inset-0">
          <MediaImage
            mediaItemId={item._id}
            url={item.url}
            entityType={item.entityType}
            mimeType={item.mimeType}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{formatEntityTypeLabel(item.entityType)}</Badge>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link href={entityHref} className="text-primary underline-offset-4 hover:underline">
          View entity
        </Link>
        <button
          type="button"
          className="text-destructive underline-offset-4 hover:underline disabled:opacity-50"
          disabled={isPending}
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this media item?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startDeleteTransition(async () => {
                  try {
                    await deleteMediaItem(item._id);
                    toast.success("Media item deleted");
                    setConfirmOpen(false);
                  } catch (error) {
                    // Keep the dialog open on failure so the error toast is
                    // actually readable instead of the whole dialog
                    // vanishing at the same instant.
                    toast.error(error instanceof Error ? error.message : "Failed to delete media item");
                  }
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [typeFilter, setTypeFilter] = useState<PublicMediaEntityType | "all">("all");
  const entityType = typeFilter !== "all" ? typeFilter : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.mediaItems.listAllPaginated,
    { entityType },
    { initialNumItems: 40 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Media Library</h1>
        <p className="text-muted-foreground">Browse and manage every uploaded photo across the site.</p>
      </div>

      <Select
        value={typeFilter}
        onValueChange={(value) => {
          if (value == null) return;
          setTypeFilter(value as PublicMediaEntityType | "all");
        }}
      >
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {PUBLIC_ENTITY_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {formatEntityTypeLabel(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {status === "LoadingFirstPage" ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No media items found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((item) => (
                <MediaLibraryCard key={item._id} item={item} />
              ))}
            </div>
          )}

          {(status === "CanLoadMore" || status === "LoadingMore") && (
            <div className="flex justify-end">
              <Button variant="outline" disabled={status === "LoadingMore"} onClick={() => loadMore(40)}>
                {status === "LoadingMore" ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
