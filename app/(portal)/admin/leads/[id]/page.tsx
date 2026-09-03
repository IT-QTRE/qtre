"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LeadEditForm } from "@/components/admin/leads/lead-edit-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

export default function LeadEditPage() {
  const params = useParams<{ id: string }>();
  const lead = useAuthedQuery(api.leads.get, { id: params.id as Id<"leads"> });

  if (lead === undefined) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/leads" label="Leads" />} title="Lead" />
        <div className="h-48 border border-border bg-muted/60" aria-hidden />
      </div>
    );
  }

  if (lead === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/leads" label="Leads" />} title="Lead" />
        <p className="max-w-prose text-sm text-muted-foreground">This inquiry is not in your inbox.</p>
      </div>
    );
  }

  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/leads" label="Leads" />}
          title={lead.name}
          description="Review the inquiry and update status or assignment."
        />
        <LeadEditForm lead={lead} />
      </div>
    </UnsavedChangesProvider>
  );
}
