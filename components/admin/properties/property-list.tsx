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
import { formatAed } from "@/lib/format/aed";
import { PropertyDeleteAction } from "./property-delete-action";

const LISTING_LABEL: Record<Doc<"properties">["listingStatus"], string> = {
  for_sale: "Sale",
  for_rent: "Rent",
  sold: "Sold",
  rented: "Rented",
  off_market: "Off market",
};

const STATUS_LABEL: Record<Doc<"properties">["publishing"]["status"], string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const SORTS = [
  { id: "createdAt", label: "Date" },
  { id: "titleText", label: "Title" },
  { id: "price", label: "Price" },
  { id: "status", label: "Status" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const COLUMNS: ColumnDef<StockFeatures, Doc<"properties">>[] = [
  { id: "titleText", accessorFn: (row) => row.title.en },
  { id: "price", accessorFn: (row) => row.price },
  { id: "status", accessorFn: (row) => row.publishing.status },
  { id: "createdAt", accessorFn: (row) => row._creationTime },
];

function bedsLabel(bedrooms: number) {
  if (bedrooms === 0) return "Studio";
  if (bedrooms >= 6) return "6+BR";
  return `${bedrooms}BR`;
}

function listingPrice(property: Doc<"properties">) {
  if (property.countryCode === "AE") {
    return formatAed(property.price, "en");
  }
  return `${property.price.toLocaleString("en-AE")} ${property.countryCode}`;
}

function titleMatches(property: Doc<"properties">, query: string) {
  const needle = query.toLowerCase();
  return [property.title.en, property.title.ar, property.title.tr]
    .filter(Boolean)
    .some((title) => title!.toLowerCase().includes(needle));
}

function PropertyRowControls({ property }: { property: Doc<"properties"> }) {
  const { menuOpen, setMenuOpen, confirmOpen, setConfirmOpen, requestDelete, onMenuOpenChangeComplete } = useRowMenuDelete();
  const setPublishingStatus = useMutation(api.properties.setPublishingStatus);
  const [isPending, startTransition] = useTransition();
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const status = property.publishing.status;
  const canToggle = status === "draft" || status === "published";

  function setStatus(next: "draft" | "published") {
    if (next === "draft" && status === "published") {
      setUnpublishOpen(true);
      return;
    }
    applyStatus(next);
  }

  function applyStatus(next: "draft" | "published") {
    startTransition(async () => {
      try {
        await setPublishingStatus({ id: property._id, status: next });
        toast.success(next === "published" ? "Published" : "Moved to draft");
        setUnpublishOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update listing. Try again.");
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
          <DropdownMenuItem render={<Link href={`/admin/properties/${property._id}`} />}>Edit</DropdownMenuItem>
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
      <PropertyDeleteAction
        propertyId={property._id}
        propertyName={property.title.en}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
      <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this listing?</AlertDialogTitle>
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

function metaLine(property: Doc<"properties">, communityName: string | undefined) {
  return [
    LISTING_LABEL[property.listingStatus],
    bedsLabel(property.bedrooms),
    `${property.areaSqft.toLocaleString("en-AE")} sq ft`,
    communityName || property.city.en,
    listingPrice(property),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function PropertyList({
  properties,
  thumbnailByPropertyId,
  communityNameById,
  toolbar,
}: {
  properties: Doc<"properties">[];
  thumbnailByPropertyId: Map<string, PrimaryMediaItem>;
  communityNameById: Map<string, string>;
  toolbar?: ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: properties,
    columns: COLUMNS,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) => titleMatches(row.original, String(value)),
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
      return [{ id: next, desc: next === "titleText" || next === "status" ? false : true }];
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

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <label htmlFor="property-search" className="sr-only">
            Search by title
          </label>
          <Input
            id="property-search"
            name="property-search"
            autoComplete="off"
            placeholder="Search by title…"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="rounded-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <AdminFilterGroup label="Sort" options={sortOptions} value={sortId} onChange={onSortChange} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {filteredCount} {filteredCount === 1 ? "listing" : "listings"}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No properties match these filters.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => {
            const property = row.original;
            const communityName = property.communityId ? communityNameById.get(property.communityId) : undefined;
            return (
              <li key={property._id} className="flex items-center gap-2">
                <Link
                  href={`/admin/properties/${property._id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 py-3.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ThumbnailCell item={thumbnailByPropertyId.get(property._id)} alt={property.title.en} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading text-sm font-medium">{property.title.en}</span>
                    {property.title.ar?.trim() ? (
                      <span dir="rtl" className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {property.title.ar}
                      </span>
                    ) : null}
                    {property.title.tr?.trim() ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{property.title.tr}</span>
                    ) : null}
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {metaLine(property, communityName)}
                    </span>
                  </span>
                </Link>
                <PropertyRowControls property={property} />
              </li>
            );
          })}
        </ul>
      )}
      {table.getCanPreviousPage() || table.getCanNextPage() ? (
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
