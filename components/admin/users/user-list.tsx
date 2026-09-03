"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ColumnDef, SortingState, StockFeatures } from "@tanstack/react-table";
import {
  useLegacyTable as useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table/legacy";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { formatRoleLabel, UserRoleSelect } from "./user-role-select";
import { ManageAccessDialog } from "./manage-access-dialog";

const SORTS = [
  { id: "createdAt", label: "Date" },
  { id: "nameText", label: "Name" },
  { id: "role", label: "Role" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const COLUMNS: ColumnDef<StockFeatures, Doc<"users">>[] = [
  { id: "nameText", accessorFn: (row) => row.name },
  { id: "role", accessorFn: (row) => row.role },
  { id: "createdAt", accessorFn: (row) => row.createdAt },
];

function matchesSearch(user: Doc<"users">, query: string) {
  const needle = query.toLowerCase();
  return [user.name, user.email, formatRoleLabel(user.role)]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle));
}

export function UserList({
  users,
  currentActor,
  toolbar,
}: {
  users: Doc<"users">[];
  currentActor: Doc<"users">;
  toolbar?: ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: users,
    columns: COLUMNS,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) => matchesSearch(row.original, String(value)),
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
      return [{ id: next, desc: next === "nameText" || next === "role" ? false : true }];
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
  const canManageAccess = currentActor.role === "super_admin";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <label htmlFor="user-search" className="sr-only">
            Search by name or email
          </label>
          <Input
            id="user-search"
            name="user-search"
            autoComplete="off"
            placeholder="Search by name or email…"
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
        {filteredCount} {filteredCount === 1 ? "user" : "users"}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users match these filters.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => {
            const user = row.original;
            return (
              <li key={user._id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1 py-3.5">
                  <p className="truncate font-heading text-sm font-medium">{user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground" translate="no">
                    {user.email || "No email on file"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <UserRoleSelect user={user} currentActor={currentActor} />
                  {canManageAccess && user.role === "admin" ? <ManageAccessDialog user={user} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {table.getCanPreviousPage() || table.getCanNextPage() ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="min-h-11" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" className="min-h-11" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
