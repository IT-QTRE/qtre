"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { LeadList } from "@/components/admin/leads/lead-list";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "closed", label: "Closed" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["id"];

function parseStatus(value: string | null): StatusFilter {
  if (value === "new" || value === "contacted" || value === "qualified" || value === "closed") return value;
  return "all";
}

function hrefWithStatus(pathname: string, queryString: string, status: StatusFilter) {
  const params = new URLSearchParams(queryString);
  if (status === "all") params.delete("status");
  else params.set("status", status);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function LeadListSkeleton() {
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

export default function LeadsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = parseStatus(searchParams.get("status"));
  const leads = useAuthedQuery(api.leads.list, {});
  const properties = useAuthedQuery(api.properties.listNames, {});
  const projects = useAuthedQuery(api.projects.listNames, {});
  const agents = useAuthedQuery(api.agents.list, {});

  function setStatus(value: StatusFilter) {
    router.replace(hrefWithStatus(pathname, searchParams.toString(), value), { scroll: false });
  }

  const propertyNameById = new Map((properties ?? []).map((property) => [property._id, property.title]));
  const projectNameById = new Map((projects ?? []).map((project) => [project._id, project.title]));
  const agentNameById = new Map((agents ?? []).map((agent) => [agent._id, agent.name]));
  const namesReady = properties !== undefined && projects !== undefined && agents !== undefined;

  const scoped = useMemo(() => {
    if (!leads) return [];
    return leads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      return true;
    });
  }, [leads, status]);

  const filters = (
    <AdminFilterGroup
      label="Lead status"
      layout="wrap"
      options={STATUS_FILTERS}
      value={status}
      onChange={setStatus}
    />
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Leads" description="Inquiries from listings on the public site." />

      {leads === undefined ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{filters}</div>
          <LeadListSkeleton />
        </div>
      ) : leads.length === 0 ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          No inquiries yet. They appear here when someone contacts you from a listing.
        </p>
      ) : (
        <LeadList
          leads={scoped}
          propertyNameById={propertyNameById}
          projectNameById={projectNameById}
          agentNameById={agentNameById}
          namesReady={namesReady}
          toolbar={filters}
        />
      )}
    </div>
  );
}
