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
import { formatCompletionDate } from "@/lib/format/completion-date";
import { PROJECT_CONSTRUCTION_LABEL } from "@/lib/constants/project-status";
import { ProjectDeleteAction } from "./project-delete-action";

const STATUS_LABEL: Record<Doc<"projects">["publishing"]["status"], string> = {
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

const COLUMNS: ColumnDef<StockFeatures, Doc<"projects">>[] = [
  { id: "titleText", accessorFn: (row) => row.title.en },
  { id: "price", accessorFn: (row) => row.startingPrice ?? 0 },
  { id: "status", accessorFn: (row) => row.publishing.status },
  { id: "createdAt", accessorFn: (row) => row._creationTime },
];

function startingPriceLabel(project: Doc<"projects">) {
  if (project.startingPrice === undefined) return null;
  if (project.countryCode === "AE") {
    return formatAed(project.startingPrice, "en");
  }
  return `${project.startingPrice.toLocaleString("en-AE")} ${project.countryCode}`;
}

function titleMatches(project: Doc<"projects">, query: string) {
  const needle = query.toLowerCase();
  return [project.title.en, project.title.ar, project.title.tr]
    .filter(Boolean)
    .some((title) => title!.toLowerCase().includes(needle));
}

function ProjectRowControls({ project }: { project: Doc<"projects"> }) {
  const { menuOpen, setMenuOpen, confirmOpen, setConfirmOpen, requestDelete, onMenuOpenChangeComplete } = useRowMenuDelete();
  const setPublishingStatus = useMutation(api.projects.setPublishingStatus);
  const [isPending, startTransition] = useTransition();
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const status = project.publishing.status;
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
        await setPublishingStatus({ id: project._id, status: next });
        toast.success(next === "published" ? "Published" : "Moved to draft");
        setUnpublishOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update project. Try again.");
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
          <DropdownMenuItem render={<Link href={`/admin/projects/${project._id}`} />}>Edit</DropdownMenuItem>
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
      <ProjectDeleteAction
        projectId={project._id}
        projectName={project.title.en}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
      <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this project?</AlertDialogTitle>
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
  project: Doc<"projects">,
  developerName: string | undefined,
  communityName: string | undefined,
) {
  return [
    PROJECT_CONSTRUCTION_LABEL[project.status],
    project.completionDate ? formatCompletionDate(project.completionDate, "en") : null,
    developerName,
    communityName || project.city.en,
    startingPriceLabel(project),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ProjectList({
  projects,
  thumbnailByProjectId,
  developerNameById,
  communityNameById,
  toolbar,
}: {
  projects: Doc<"projects">[];
  thumbnailByProjectId: Map<string, PrimaryMediaItem>;
  developerNameById: Map<string, string>;
  communityNameById: Map<string, string>;
  toolbar?: ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: projects,
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
          <label htmlFor="project-search" className="sr-only">
            Search by title
          </label>
          <Input
            id="project-search"
            name="project-search"
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
        {filteredCount} {filteredCount === 1 ? "project" : "projects"}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects match these filters.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => {
            const project = row.original;
            const communityName = project.communityId ? communityNameById.get(project.communityId) : undefined;
            return (
              <li key={project._id} className="flex items-center gap-2">
                <Link
                  href={`/admin/projects/${project._id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 py-3.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ThumbnailCell item={thumbnailByProjectId.get(project._id)} alt={project.title.en} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading text-sm font-medium">{project.title.en}</span>
                    {project.title.ar?.trim() ? (
                      <span dir="rtl" className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {project.title.ar}
                      </span>
                    ) : null}
                    {project.title.tr?.trim() ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{project.title.tr}</span>
                    ) : null}
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {metaLine(project, developerNameById.get(project.developerId), communityName)}
                    </span>
                  </span>
                </Link>
                <ProjectRowControls project={project} />
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
