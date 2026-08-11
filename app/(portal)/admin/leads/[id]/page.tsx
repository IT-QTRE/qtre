"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LeadEditForm } from "@/components/admin/leads/lead-edit-form";
import { BackLink } from "@/components/admin/back-link";

export default function LeadEditPage() {
  const params = useParams<{ id: string }>();
  const lead = useQuery(api.leads.get, { id: params.id as Id<"leads"> });

  if (lead === undefined) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (lead === null) {
    return <p className="text-muted-foreground">Lead not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/leads" label="Back to Leads" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lead.name}</h1>
        <p className="text-muted-foreground">Review inquiry and update status or assignment.</p>
      </div>
      <LeadEditForm lead={lead} />
    </div>
  );
}
