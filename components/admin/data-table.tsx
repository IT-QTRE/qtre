"use client";

import { useState } from "react";
import type { ColumnDef, SortingState, StockFeatures } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
// `@tanstack/react-table` v9 replaced v8's `useReactTable` with a new
// `useTable` API built around explicit, tree-shakeable `features`. The
// `/legacy` subpath ships a compatibility layer (`useLegacyTable` +
// stub `get*RowModel` markers) that reproduces the exact v8 shape this
// component is written against — used deliberately instead of adopting the
// new `useTable`/`features` API, which would be a much larger redesign for
// no behavioral benefit at this table size.
import {
  useLegacyTable as useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table/legacy";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// `TData` is constrained to `Record<string, unknown>` to satisfy v9's
// `RowData = Record<string, any> | Array<any>` bound (required by
// `useLegacyTable`/`ColumnDef`'s generics) — every entity this table renders
// (Convex documents) already satisfies this shape.
type DataTableProps<TData extends Record<string, unknown>> = {
  columns: ColumnDef<StockFeatures, TData>[];
  data: TData[];
  searchPlaceholder?: string;
  /** Column id whose value the global search filters against. */
  filterColumnId?: string;
  bulkActions?: (selected: TData[]) => React.ReactNode;
  toolbar?: React.ReactNode;
  emptyMessage?: string;
};

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  searchPlaceholder,
  filterColumnId,
  bulkActions,
  toolbar,
  emptyMessage,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: filterColumnId
      ? (row, _columnId, value) => String(row.getValue(filterColumnId) ?? "").toLowerCase().includes(String(value).toLowerCase())
      : "auto",
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          placeholder={searchPlaceholder ?? "Search..."}
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm rounded-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {bulkActions && selectedRows.length > 0 ? bulkActions(selectedRows) : null}
        </div>
      </div>
      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage ?? "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
