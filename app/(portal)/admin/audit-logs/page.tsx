"use client";

import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RESOURCES, type Resource } from "@/convex/lib/roles";
import { formatDate } from "@/lib/format/date";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatResourceLabel(resource: string): string {
  return resource
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export default function AuditLogsPage() {
  const [resourceFilter, setResourceFilter] = useState<Resource | "all">("all");
  // Stored as string so Select's value type accepts both `"all"` and branded user ids.
  const [actorFilter, setActorFilter] = useState<string>("all");

  const users = useQuery(api.users.list) ?? [];
  // Falls back to name when email is blank (e.g. a Clerk identity whose
  // email claim wasn't captured at provisioning time) so the Actor column
  // never silently renders empty instead of "Unknown".
  const labelByUserId = new Map(users.map((user) => [user._id, user.email || user.name]));

  const resource = resourceFilter !== "all" ? resourceFilter : undefined;
  const actorUserId =
    actorFilter !== "all" ? (actorFilter as Id<"users">) : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.auditLogs.listPaginated,
    { resource, actorUserId },
    { initialNumItems: 50 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Audit Logs</h1>
        <p className="text-muted-foreground">
          A read-only history of every sensitive change made in the admin panel.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={resourceFilter}
          onValueChange={(value) => {
            if (value == null) return;
            const next = value as Resource | "all";
            setResourceFilter(next);
            if (next !== "all") {
              setActorFilter("all");
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {RESOURCES.map((item) => (
              <SelectItem key={item} value={item}>
                {formatResourceLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={actorFilter}
          onValueChange={(value) => {
            if (value == null) return;
            setActorFilter(value);
            if (value !== "all") {
              setResourceFilter("all");
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actors</SelectItem>
            {users.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {user.email || user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {status === "LoadingFirstPage" ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No audit log entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((row) => {
                    const actorLabel = labelByUserId.get(row.actorUserId);
                    return (
                      <TableRow key={row._id}>
                        <TableCell>
                          {formatDate(row.createdAt)}, {formatTime(row.createdAt)}
                        </TableCell>
                        <TableCell>
                          {actorLabel || <span className="text-muted-foreground">Unknown</span>}
                        </TableCell>
                        <TableCell>{row.resource}</TableCell>
                        <TableCell>{row.action}</TableCell>
                        <TableCell>{row.targetId ?? "—"}</TableCell>
                        <TableCell>{row.details ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {(status === "CanLoadMore" || status === "LoadingMore") && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                disabled={status === "LoadingMore"}
                onClick={() => loadMore(50)}
              >
                {status === "LoadingMore" ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
