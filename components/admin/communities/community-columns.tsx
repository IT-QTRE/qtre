"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { ColumnDef, StockFeatures } from "@tanstack/react-table";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/admin/data-table-column-header";
import { ThumbnailCell, type PrimaryMediaItem } from "@/components/admin/thumbnail-cell";
import { useRowMenuDelete } from "@/components/admin/use-row-menu-delete";
import { formatDate } from "@/lib/format/date";
import { CommunityDeleteAction } from "./community-delete-action";

// "published" gets the brand's primary burgundy (the one active/live state
// worth signaling); "draft" and "archived" both stay neutral so gold — the
// brand's "premium accent" color — isn't spent on routine, low-emphasis
// statuses that appear on most rows most of the time.
const STATUS_VARIANT: Record<Doc<"communities">["publishing"]["status"], "outline" | "default" | "muted"> = {
  draft: "outline",
  published: "default",
  archived: "muted",
};

// A named component (rather than an inline arrow function passed as
// `cell`) so `useRowMenuDelete`'s hook calls follow React's rules of
// hooks — `flexRender` happens to render plain functions as components too,
// but ESLint's hook checker can't see that, and a real component is the
// unambiguous, checkable way to do it.
function CommunityRowActions({ community }: { community: Doc<"communities"> }) {
  const { menuOpen, setMenuOpen, confirmOpen, setConfirmOpen, requestDelete, onMenuOpenChangeComplete } = useRowMenuDelete();
  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} onOpenChangeComplete={onMenuOpenChangeComplete}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Row actions" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/communities/${community._id}`} />}>Edit</DropdownMenuItem>
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
    </>
  );
}

export function getCommunityColumns(
  thumbnailByCommunityId: Map<string, PrimaryMediaItem>,
): ColumnDef<StockFeatures, Doc<"communities">>[] {
  return [
    {
      id: "thumbnail",
      header: "",
      cell: ({ row }) => <ThumbnailCell item={thumbnailByCommunityId.get(row.original._id)} />,
    },
    {
      id: "nameText",
      accessorFn: (row) => row.name.en,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium">{row.original.name.en}</span>,
    },
    {
      id: "countryCode",
      accessorFn: (row) => row.countryCode,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
    },
    {
      id: "city",
      accessorFn: (row) => row.city.en,
      header: "City",
    },
    {
      id: "slug",
      accessorFn: (row) => row.publishing.slug,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
    },
    {
      id: "status",
      accessorFn: (row) => row.publishing.status,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.publishing.status;
        return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
      },
    },
    {
      id: "createdAt",
      accessorFn: (row) => row._creationTime,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original._creationTime)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <CommunityRowActions community={row.original} />,
    },
  ];
}
