"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react";
import type { ColumnDef, SortingState, StockFeatures } from "@tanstack/react-table";
import {
  useLegacyTable as useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table/legacy";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRowMenuDelete } from "@/components/admin/use-row-menu-delete";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { LeadDeleteAction } from "./lead-delete-action";

const STATUS_LABEL: Record<Doc<"leads">["status"], string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
};

const SORTS = [
  { id: "createdAt", label: "Date" },
  { id: "nameText", label: "Name" },
  { id: "status", label: "Status" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const COLUMNS: ColumnDef<StockFeatures, Doc<"leads">>[] = [
  { id: "nameText", accessorFn: (row) => row.name },
  { id: "status", accessorFn: (row) => row.status },
  { id: "createdAt", accessorFn: (row) => row.createdAt },
];

export function regardingLabel(
  lead: Doc<"leads">,
  propertyNameById: Map<string, string>,
  projectNameById: Map<string, string>,
  namesReady: boolean,
): string {
  if (lead.propertyId) {
    const name = propertyNameById.get(lead.propertyId);
    if (name) return name;
    return namesReady ? "Deleted property" : "Property";
  }
  if (lead.projectId) {
    const name = projectNameById.get(lead.projectId);
    if (name) return name;
    return namesReady ? "Deleted project" : "Project";
  }
  return "General inquiry";
}

function matchesSearch(
  lead: Doc<"leads">,
  query: string,
  propertyNameById: Map<string, string>,
  projectNameById: Map<string, string>,
  agentNameById: Map<string, string>,
  namesReady: boolean,
) {
  const needle = query.toLowerCase();
  const regarding = regardingLabel(lead, propertyNameById, projectNameById, namesReady);
  const agent = lead.assignedAgentId ? agentNameById.get(lead.assignedAgentId) : undefined;
  return [lead.name, lead.email, lead.phone, regarding, agent]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle));
}

function LeadRowControls({ lead }: { lead: Doc<"leads"> }) {
  const { menuOpen, setMenuOpen, confirmOpen, setConfirmOpen, requestDelete, onMenuOpenChangeComplete } = useRowMenuDelete();
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span
        className={cn(
          "inline-flex min-h-11 items-center px-3 text-xs font-medium",
          lead.status === "new" ? "text-primary" : "text-muted-foreground",
        )}
      >
        {STATUS_LABEL[lead.status]}
      </span>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} onOpenChangeComplete={onMenuOpenChangeComplete}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-11" aria-label="Row actions" />}>
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/leads/${lead._id}`} />}>View</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={requestDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LeadDeleteAction leadId={lead._id} leadName={lead.name} open={confirmOpen} onOpenChange={setConfirmOpen} />
    </div>
  );
}

function metaLine(
  lead: Doc<"leads">,
  propertyNameById: Map<string, string>,
  projectNameById: Map<string, string>,
  agentNameById: Map<string, string>,
  namesReady: boolean,
) {
  const regarding = regardingLabel(lead, propertyNameById, projectNameById, namesReady);
  const agent = lead.assignedAgentId
    ? (agentNameById.get(lead.assignedAgentId) ?? (namesReady ? "Deleted agent" : undefined))
    : undefined;
  return [lead.email, regarding, agent].filter(Boolean).join(" · ");
}

export function LeadList({
  leads,
  propertyNameById,
  projectNameById,
  agentNameById,
  namesReady,
  toolbar,
}: {
  leads: Doc<"leads">[];
  propertyNameById: Map<string, string>;
  projectNameById: Map<string, string>;
  agentNameById: Map<string, string>;
  namesReady: boolean;
  toolbar?: ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: leads,
    columns: COLUMNS,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) =>
      matchesSearch(row.original, String(value), propertyNameById, projectNameById, agentNameById, namesReady),
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

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <label htmlFor="lead-search" className="sr-only">
            Search by name
          </label>
          <Input
            id="lead-search"
            name="lead-search"
            autoComplete="off"
            placeholder="Search by name…"
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
        {filteredCount} {filteredCount === 1 ? "lead" : "leads"}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No leads match these filters.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => {
            const lead = row.original;
            const line = metaLine(lead, propertyNameById, projectNameById, agentNameById, namesReady);
            return (
              <li key={lead._id} className="flex items-center gap-2">
                <Link
                  href={`/admin/leads/${lead._id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 py-3.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading text-sm font-medium">{lead.name}</span>
                    {line ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{line}</span> : null}
                  </span>
                </Link>
                <LeadRowControls lead={lead} />
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
