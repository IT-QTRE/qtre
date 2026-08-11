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
import { ProjectDeleteAction } from "./project-delete-action";

// "published" gets the brand's primary burgundy (the one active/live state
// worth signaling); "draft" and "archived" both stay neutral so gold — the
// brand's "premium accent" color — isn't spent on routine, low-emphasis
// statuses that appear on most rows most of the time.
const STATUS_VARIANT: Record<Doc<"projects">["publishing"]["status"], "outline" | "default" | "muted"> = {
  draft: "outline",
  published: "default",
  archived: "muted",
};

// A named component (rather than an inline arrow function passed as
// `cell`) so `useRowMenuDelete`'s hook calls follow React's rules of
// hooks — `flexRender` happens to render plain functions as components too,
// but ESLint's hook checker can't see that, and a real component is the
// unambiguous, checkable way to do it.
function ProjectRowActions({ project }: { project: Doc<"projects"> }) {
  const { menuOpen, setMenuOpen, confirmOpen, setConfirmOpen, requestDelete, onMenuOpenChangeComplete } = useRowMenuDelete();
  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} onOpenChangeComplete={onMenuOpenChangeComplete}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Row actions" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/projects/${project._id}`} />}>Edit</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={requestDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProjectDeleteAction
        projectId={project._id}
        projectName={project.title.en}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
    </>
  );
}

// Developer name isn't stored on the project row itself, so the list page
// builds an id-to-name Map (one extra `developers.list` query, not one
// query per row) and passes it in here — a `cell` closure over a per-row
// lookup, per the Vercel react-best-practices "index map" guidance.
export function getProjectColumns(
  developerNameById: Map<string, string>,
  thumbnailByProjectId: Map<string, PrimaryMediaItem>,
): ColumnDef<StockFeatures, Doc<"projects">>[] {
  return [
    {
      id: "thumbnail",
      header: "",
      cell: ({ row }) => <ThumbnailCell item={thumbnailByProjectId.get(row.original._id)} />,
    },
    {
      id: "titleText",
      accessorFn: (row) => row.title.en,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => <span className="font-medium">{row.original.title.en}</span>,
    },
    {
      id: "developer",
      accessorFn: (row) => developerNameById.get(row.developerId) ?? "—",
      header: "Developer",
    },
    {
      id: "location",
      accessorFn: (row) => `${row.city.en}, ${row.countryCode}`,
      header: "Location",
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
      cell: ({ row }) => <ProjectRowActions project={row.original} />,
    },
  ];
}
