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
import { useRowMenuDelete } from "@/components/admin/use-row-menu-delete";
import { formatDate } from "@/lib/format/date";
import { LeadDeleteAction } from "./lead-delete-action";

// "new" gets the brand's primary burgundy (the inbound state that needs
// attention); contacted/qualified stay neutral outline, and closed is muted
// so gold — the brand's "premium accent" — isn't spent on routine statuses.
const STATUS_VARIANT: Record<Doc<"leads">["status"], "outline" | "default" | "muted"> = {
  new: "default",
  contacted: "outline",
  qualified: "outline",
  closed: "muted",
};

function inquiryAboutLabel(
  lead: Doc<"leads">,
  propertyNameById: Map<string, string>,
  projectNameById: Map<string, string>,
): string {
  if (lead.propertyId) {
    const name = propertyNameById.get(lead.propertyId) ?? "Deleted property";
    return `Property: ${name}`;
  }
  if (lead.projectId) {
    const name = projectNameById.get(lead.projectId) ?? "Deleted project";
    return `Project: ${name}`;
  }
  return "General inquiry";
}

// A named component (rather than an inline arrow function passed as
// `cell`) so `useRowMenuDelete`'s hook calls follow React's rules of
// hooks — `flexRender` happens to render plain functions as components too,
// but ESLint's hook checker can't see that, and a real component is the
// unambiguous, checkable way to do it.
function LeadRowActions({ lead }: { lead: Doc<"leads"> }) {
  const { menuOpen, setMenuOpen, confirmOpen, setConfirmOpen, requestDelete, onMenuOpenChangeComplete } = useRowMenuDelete();
  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} onOpenChangeComplete={onMenuOpenChangeComplete}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Row actions" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/leads/${lead._id}`} />}>View</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={requestDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LeadDeleteAction leadId={lead._id} leadName={lead.name} open={confirmOpen} onOpenChange={setConfirmOpen} />
    </>
  );
}

export function getLeadColumns(
  propertyNameById: Map<string, string>,
  projectNameById: Map<string, string>,
  agentNameById: Map<string, string>,
): ColumnDef<StockFeatures, Doc<"leads">>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => row.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      id: "inquiryAbout",
      accessorFn: (row) => inquiryAboutLabel(row, propertyNameById, projectNameById),
      header: "Regarding",
      cell: ({ row }) => {
        const lead = row.original;
        if (!lead.propertyId && !lead.projectId) {
          return <span className="text-muted-foreground">General inquiry</span>;
        }
        return <span>{inquiryAboutLabel(lead, propertyNameById, projectNameById)}</span>;
      },
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
      },
    },
    {
      id: "assignedAgent",
      accessorFn: (row) => {
        if (!row.assignedAgentId) return "Unassigned";
        return agentNameById.get(row.assignedAgentId) ?? "Deleted agent";
      },
      header: "Assigned Agent",
      cell: ({ row }) => {
        const agentId = row.original.assignedAgentId;
        if (!agentId) {
          return <span className="text-muted-foreground">Unassigned</span>;
        }
        const name = agentNameById.get(agentId);
        if (!name) {
          return <span className="text-muted-foreground">Deleted agent</span>;
        }
        return <span>{name}</span>;
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
      cell: ({ row }) => <LeadRowActions lead={row.original} />,
    },
  ];
}
