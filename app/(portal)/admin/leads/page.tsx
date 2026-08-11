"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/components/admin/data-table";
import { getLeadColumns } from "@/components/admin/leads/lead-columns";

export default function LeadsPage() {
  const leads = useQuery(api.leads.list);
  // `listNames` (rather than `list`) — a lead can point at any Admin's
  // property/project, and Properties/Projects are otherwise Admin-scoped.
  const properties = useQuery(api.properties.listNames) ?? [];
  const projects = useQuery(api.projects.listNames) ?? [];
  const agents = useQuery(api.agents.list) ?? [];

  const propertyNameById = new Map(properties.map((property) => [property._id, property.title]));
  const projectNameById = new Map(projects.map((project) => [project._id, project.title]));
  const agentNameById = new Map(agents.map((agent) => [agent._id, agent.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Leads</h1>
        <p className="text-muted-foreground">Property and project inquiries from the public site.</p>
      </div>
      {leads === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={getLeadColumns(propertyNameById, projectNameById, agentNameById)}
          data={leads}
          searchPlaceholder="Search leads..."
          filterColumnId="name"
        />
      )}
    </div>
  );
}
