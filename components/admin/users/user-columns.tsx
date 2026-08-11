"use client";

import type { ColumnDef, StockFeatures } from "@tanstack/react-table";
import type { Doc } from "@/convex/_generated/dataModel";
import { DataTableColumnHeader } from "@/components/admin/data-table-column-header";
import { formatDate } from "@/lib/format/date";
import { UserRoleSelect } from "./user-role-select";
import { ManageAccessDialog } from "./manage-access-dialog";

export function getUserColumns(
  currentActor: Doc<"users">,
): ColumnDef<StockFeatures, Doc<"users">>[] {
  const columns: ColumnDef<StockFeatures, Doc<"users">>[] = [
    {
      id: "name",
      accessorFn: (row) => row.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-sm text-muted-foreground">
            {row.original.email || "No email on file"}
          </span>
        </div>
      ),
    },
    {
      id: "role",
      accessorFn: (row) => row.role,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => (
        <UserRoleSelect user={row.original} currentActor={currentActor} />
      ),
    },
    {
      id: "createdAt",
      accessorFn: (row) => row.createdAt,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];

  // Only Super Admin can manage per-account access, and only Admin
  // accounts have anything to restrict — hide the column entirely
  // otherwise rather than showing empty cells.
  if (currentActor.role === "super_admin") {
    columns.push({
      id: "access",
      header: "Access",
      cell: ({ row }) => (row.original.role === "admin" ? <ManageAccessDialog user={row.original} /> : null),
    });
  }

  return columns;
}
