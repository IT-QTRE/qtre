"use client";

import { useConvexAuth, usePaginatedQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RESOURCES, type Resource } from "@/convex/lib/roles";
import { formatDate } from "@/lib/format/date";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const RESOURCE_LABEL: Record<Resource, string> = {
  properties: "Properties",
  projects: "Projects",
  developers: "Developers",
  agents: "Agents",
  communities: "Communities",
  leads: "Leads",
  propertySubmissions: "Submissions",
  blogPosts: "Blog",
  mediaItems: "Media",
  users: "Users",
  websiteSettings: "Settings",
  auditLogs: "Audit logs",
};

const RESOURCE_FILTERS = [
  { id: "all", label: "All" },
  ...RESOURCES.map((resource) => ({ id: resource, label: RESOURCE_LABEL[resource] })),
] as const;

type ResourceFilter = (typeof RESOURCE_FILTERS)[number]["id"];

function parseResource(value: string | null): ResourceFilter {
  if (value && (RESOURCES as readonly string[]).includes(value)) return value as Resource;
  return "all";
}

function hrefWithFilters(pathname: string, queryString: string, resource: ResourceFilter, actor: string) {
  const params = new URLSearchParams(queryString);
  if (resource === "all") params.delete("resource");
  else params.set("resource", resource);
  if (actor === "all") params.delete("actor");
  else params.set("actor", actor);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

function formatTime(ms: number): string {
  return TIME_FORMATTER.format(new Date(ms));
}

function formatAction(action: string) {
  return action.replace(/_/g, " ");
}

function AuditListSkeleton() {
  return (
    <div className="divide-y divide-border border-y border-border" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3.5">
          <div className="h-3 w-48 bg-muted" />
          <div className="ms-auto h-3 w-20 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function AuditLogsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useConvexAuth();
  const resourceFilter = parseResource(searchParams.get("resource"));
  const actorFilter = searchParams.get("actor") ?? "all";

  const users = useAuthedQuery(api.users.list, {});
  const labelByUserId = new Map((users ?? []).map((user) => [user._id, user.email || user.name]));

  function setResource(value: ResourceFilter) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), value, "all"), { scroll: false });
  }

  function setActor(value: string) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), "all", value), { scroll: false });
  }

  const resource = resourceFilter !== "all" ? resourceFilter : undefined;
  const actorUserId = actorFilter !== "all" ? (actorFilter as Id<"users">) : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.auditLogs.listPaginated,
    isAuthenticated ? { resource, actorUserId } : "skip",
    { initialNumItems: 50 },
  );

  const loading = !isAuthenticated || status === "LoadingFirstPage";

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Audit Logs" description="Read-only history of sensitive admin changes." />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <AdminFilterGroup
            label="Resource"
            layout="wrap"
            options={RESOURCE_FILTERS}
            value={resourceFilter}
            onChange={setResource}
          />
          <Select
            value={actorFilter}
            onValueChange={(value) => {
              if (value == null) return;
              setActor(value);
            }}
          >
            <SelectTrigger
              aria-label="Filter by person"
              className="min-h-11 w-full touch-manipulation sm:w-72"
            >
              <SelectValue placeholder="All people" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All people</SelectItem>
              {(users ?? []).map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.email || user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <AuditListSkeleton />
        ) : results.length === 0 ? (
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">No matching log entries.</p>
        ) : (
          <>
            <ul className="divide-y divide-border border-y border-border">
              {results.map((row) => {
                const actorLabel = labelByUserId.get(row.actorUserId);
                const resourceLabel = RESOURCE_LABEL[row.resource as Resource] ?? row.resource;
                return (
                  <li key={row._id} className="flex items-baseline gap-3 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <span className="font-medium" translate="no">
                          {actorLabel || "Unknown"}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          {formatAction(row.action)} · {resourceLabel}
                        </span>
                      </p>
                      {row.targetId || row.details ? (
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground" translate="no">
                          {[row.targetId, row.details].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 tabular-nums text-xs text-muted-foreground">
                      {formatDate(row.createdAt)} {formatTime(row.createdAt)}
                    </p>
                  </li>
                );
              })}
            </ul>
            {status === "CanLoadMore" || status === "LoadingMore" ? (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={status === "LoadingMore"}
                  onClick={() => loadMore(50)}
                >
                  {status === "LoadingMore" ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
