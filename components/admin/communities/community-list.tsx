"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import type { ColumnDef, SortingState, StockFeatures } from "@tanstack/react-table";
import {
  useLegacyTable as useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table/legacy";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThumbnailCell, type PrimaryMediaItem } from "@/components/admin/thumbnail-cell";
import { useRowMenuDelete } from "@/components/admin/use-row-menu-delete";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { communityPublishNotes } from "@/lib/admin/community-publish";
import { compareCatalogRank } from "@/convex/lib/catalogRank";
import { SortableCatalogList, SortableCatalogRow, useCatalogReorder } from "@/components/admin/sortable-catalog-row";
import { CommunityDeleteAction } from "./community-delete-action";

const STATUS_LABEL: Record<Doc<"communities">["publishing"]["status"], string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const SORTS = [
  { id: "createdAt", label: "Date" },
  { id: "nameText", label: "Name" },
  { id: "status", label: "Status" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const COLUMNS: ColumnDef<StockFeatures, Doc<"communities">>[] = [
  { id: "nameText", accessorFn: (row) => row.name.en },
  { id: "status", accessorFn: (row) => row.publishing.status },
  { id: "createdAt", accessorFn: (row) => row._creationTime },
];

function nameMatches(community: Doc<"communities">, query: string) {
  const needle = query.toLowerCase();
  return [community.name.en, community.name.ar, community.name.tr]
    .filter(Boolean)
    .some((name) => name!.toLowerCase().includes(needle));
}

function CommunityRowControls({
  community,
  photoCount,
}: {
  community: Doc<"communities">;
  photoCount: number;
}) {
  const { menuOpen, setMenuOpen, confirmOpen, setConfirmOpen, requestDelete, onMenuOpenChangeComplete } = useRowMenuDelete();
  const setPublishingStatus = useMutation(api.communities.setPublishingStatus);
  const [isPending, startTransition] = useTransition();
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const status = community.publishing.status;
  const canToggle = status === "draft" || status === "published";
  const publishNotes = communityPublishNotes({
    photoCount,
    name: community.name,
    description: community.description,
    city: community.city,
  });

  function setStatus(next: "draft" | "published") {
    if (next === "draft" && status === "published") {
      setUnpublishOpen(true);
      return;
    }
    if (next === "published" && status !== "published" && publishNotes.length > 0) {
      setPublishOpen(true);
      return;
    }
    applyStatus(next);
  }

  function applyStatus(next: "draft" | "published") {
    startTransition(async () => {
      try {
        await setPublishingStatus({ id: community._id, status: next });
        toast.success(next === "published" ? "Published" : "Moved to draft");
        setUnpublishOpen(false);
        setPublishOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update community. Try again.");
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center">
      {canToggle ? (
        <div className="inline-flex overflow-hidden rounded-4xl border border-border" role="group" aria-label="Publishing status">
          {(["draft", "published"] as const).map((option, index) => {
            const selected = status === option;
            const label = STATUS_LABEL[option];
            const action = option === "published" ? "Publish" : "Move to draft";
            return (
              <button
                key={option}
                type="button"
                disabled={isPending}
                aria-pressed={selected}
                aria-label={selected ? label : action}
                title={selected ? label : action}
                onClick={() => {
                  if (!selected) setStatus(option);
                }}
                className={cn(
                  "inline-flex min-h-11 min-w-22 items-center justify-center px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
                  index > 0 ? "border-s border-border" : "",
                  selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="inline-flex h-8 min-w-27 items-center justify-center px-2 text-xs text-muted-foreground">
          {STATUS_LABEL[status]}
        </span>
      )}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} onOpenChangeComplete={onMenuOpenChangeComplete}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-11" aria-label="Row actions" />}>
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/communities/${community._id}`} />}>Edit</DropdownMenuItem>
          {status === "archived" ? (
            <>
              <DropdownMenuItem disabled={isPending} onClick={() => setStatus("published")}>
                Publish
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isPending} onClick={() => setStatus("draft")}>
                Move to draft
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuItem variant="destructive" onClick={requestDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CommunityDeleteAction
        communityId={community._id}
        communityName={community.name.en}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this community?</AlertDialogTitle>
            <AlertDialogDescription>
              Live at /en/communities/{community.publishing.slug}. /ar and /tr use the same slug and fall back to
              English where a translation is blank. {publishNotes.join(" ")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={() => applyStatus("published")}>
              {isPending ? "Publishing…" : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this community?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the public catalog. You can publish it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={() => applyStatus("draft")}>
              {isPending ? "Moving…" : "Move to draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function metaLine(
  community: Doc<"communities">,
  counts: { properties: number; projects: number } | undefined,
) {
  const place = [community.city.en, community.countryCode].filter(Boolean).join(" · ");
  if (!counts) return place;
  const stock = [
    counts.properties > 0 ? `${counts.properties} ${counts.properties === 1 ? "property" : "properties"}` : null,
    counts.projects > 0 ? `${counts.projects} ${counts.projects === 1 ? "project" : "projects"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return stock ? `${place} · ${stock}` : `${place} · No listings`;
}

function CommunityRowInner({
  community,
  thumbnail,
  counts,
}: {
  community: Doc<"communities">;
  thumbnail: PrimaryMediaItem | undefined;
  counts: { properties: number; projects: number } | undefined;
}) {
  return (
    <>
      <Link
        href={`/admin/communities/${community._id}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ThumbnailCell item={thumbnail} alt={community.name.en} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-heading text-sm font-medium">{community.name.en}</span>
          {community.name.ar?.trim() ? (
            <span dir="rtl" className="mt-0.5 block truncate text-xs text-muted-foreground">
              {community.name.ar}
            </span>
          ) : null}
          {community.name.tr?.trim() ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{community.name.tr}</span>
          ) : null}
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{metaLine(community, counts)}</span>
        </span>
      </Link>
      <CommunityRowControls community={community} photoCount={thumbnail ? 1 : 0} />
    </>
  );
}

export function CommunityList({
  communities,
  thumbnailByCommunityId,
  linkCountsByCommunityId,
  toolbar,
  reorderEnabled = false,
}: {
  communities: Doc<"communities">[];
  thumbnailByCommunityId: Map<string, PrimaryMediaItem>;
  linkCountsByCommunityId: Map<string, { properties: number; projects: number }>;
  toolbar?: ReactNode;
  reorderEnabled?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const reorderCommunities = useMutation(api.communities.reorder);
  const searching = globalFilter.trim().length > 0;
  const canDrag = reorderEnabled && !searching;
  const ranked = useMemo(() => [...communities].sort(compareCatalogRank), [communities]);
  const handleDragEnd = useCatalogReorder(ranked, (args) =>
    reorderCommunities(args).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to reorder. Try again.");
    }),
  );

  const table = useReactTable({
    data: communities,
    columns: COLUMNS,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) => nameMatches(row.original, String(value)),
    initialState: { pagination: { pageIndex: 0, pageSize: 25 } },
  });

  const activeSort = sorting[0];
  const sortId = (SORTS.some((sort) => sort.id === activeSort?.id) ? activeSort?.id : "createdAt") as SortId;
  const sortDesc = activeSort?.desc ?? true;

  function onSortChange(next: SortId) {
    setSorting((current) => {
      const existing = current[0];
      if (existing?.id === next) {
        return [{ id: next, desc: !existing.desc }];
      }
      return [{ id: next, desc: next === "nameText" || next === "status" ? false : true }];
    });
  }

  const sortOptions = useMemo(
    () =>
      SORTS.map((sort) => {
        const active = sort.id === sortId;
        const direction = sortDesc ? "descending" : "ascending";
        return {
          id: sort.id,
          ariaLabel: active ? `${sort.label}, ${direction}. Activate to reverse.` : `Sort by ${sort.label}`,
          label: active ? (
            <span className="inline-flex items-center gap-1">
              {sort.label}
              {sortDesc ? <ArrowDown className="size-3" aria-hidden /> : <ArrowUp className="size-3" aria-hidden />}
            </span>
          ) : (
            sort.label
          ),
        };
      }),
    [sortDesc, sortId],
  );

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const displayed = canDrag ? ranked : rows.map((row) => row.original);
  const count = canDrag ? communities.length : filteredCount;
  const hint = canDrag
    ? "Drag the handle to set public order. Directories and the home page follow this list."
    : reorderEnabled && searching
      ? "Clear search to reorder."
      : !reorderEnabled
        ? "Switch to All to reorder."
        : null;

  const list = (
    <ul className="divide-y divide-border border-y border-border">
      {displayed.map((community) => {
        const inner = (
          <CommunityRowInner
            community={community}
            thumbnail={thumbnailByCommunityId.get(community._id)}
            counts={linkCountsByCommunityId.get(community._id)}
          />
        );
        return canDrag ? (
          <SortableCatalogRow key={community._id} id={community._id}>
            {inner}
          </SortableCatalogRow>
        ) : (
          <li key={community._id} className="flex items-center gap-2">
            {inner}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <label htmlFor="community-search" className="sr-only">
            Search by name
          </label>
          <Input
            id="community-search"
            name="community-search"
            autoComplete="off"
            placeholder="Search by name…"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="rounded-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {canDrag ? null : (
            <AdminFilterGroup label="Sort" options={sortOptions} value={sortId} onChange={onSortChange} />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {count} {count === 1 ? "community" : "communities"}
        {hint ? ` · ${hint}` : null}
      </p>
      {displayed.length === 0 ? (
        <p className="text-sm text-muted-foreground">No communities match these filters.</p>
      ) : canDrag ? (
        <SortableCatalogList ids={ranked.map((community) => community._id)} onDragEnd={handleDragEnd}>
          {list}
        </SortableCatalogList>
      ) : (
        list
      )}
      {!canDrag && (table.getCanPreviousPage() || table.getCanNextPage()) ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
