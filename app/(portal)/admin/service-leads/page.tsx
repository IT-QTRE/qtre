"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { ServiceLeadList } from "@/components/admin/service-leads/service-lead-list";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "closed", label: "Closed" },
] as const;

const GROUP_FILTERS = [
  { id: "all", label: "All desks" },
  { id: "visa", label: "Visa" },
  { id: "license", label: "License" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["id"];
type GroupFilter = (typeof GROUP_FILTERS)[number]["id"];

function parseStatus(value: string | null): StatusFilter {
  if (value === "new" || value === "contacted" || value === "qualified" || value === "closed") return value;
  return "all";
}

function parseGroup(value: string | null): GroupFilter {
  if (value === "visa" || value === "license") return value;
  return "all";
}

function hrefWithFilters(pathname: string, queryString: string, status: StatusFilter, group: GroupFilter) {
  const params = new URLSearchParams(queryString);
  if (status === "all") params.delete("status");
  else params.set("status", status);
  if (group === "all") params.delete("group");
  else params.set("group", group);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-border border-y border-border" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3.5">
          <div className="h-3 w-40 bg-muted" />
          <div className="ms-auto h-3 w-16 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function ServiceLeadsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = parseStatus(searchParams.get("status"));
  const group = parseGroup(searchParams.get("group"));
  const leads = useAuthedQuery(api.serviceLeads.list, {});
  const assignees = useAuthedQuery(api.serviceLeads.listAssignees, {});

  function setStatus(value: StatusFilter) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), value, group), { scroll: false });
  }

  function setGroup(value: GroupFilter) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), status, value), { scroll: false });
  }

  const assigneeNameById = new Map((assignees ?? []).map((user) => [user._id, user.name || user.email]));
  const namesReady = assignees !== undefined;

  const scoped = useMemo(() => {
    if (!leads) return [];
    return leads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (group !== "all" && lead.group !== group) return false;
      return true;
    });
  }, [leads, status, group]);

  const filters = (
    <>
      <AdminFilterGroup label="Desk group" layout="wrap" options={GROUP_FILTERS} value={group} onChange={setGroup} />
      <AdminFilterGroup label="Inquiry status" layout="wrap" options={STATUS_FILTERS} value={status} onChange={setStatus} />
    </>
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Service leads"
        description="Visa and license inquiries from the Services pages."
      />

      {leads === undefined ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{filters}</div>
          <ListSkeleton />
        </div>
      ) : leads.length === 0 ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          No inquiries yet. They appear here when someone sends the visa or license form on Services.
        </p>
      ) : (
        <ServiceLeadList
          leads={scoped}
          assigneeNameById={assigneeNameById}
          namesReady={namesReady}
          toolbar={filters}
        />
      )}
    </div>
  );
}
