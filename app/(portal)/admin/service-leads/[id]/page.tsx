"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ServiceLeadEditForm } from "@/components/admin/service-leads/service-lead-edit-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

export default function ServiceLeadEditPage() {
  const params = useParams<{ id: string }>();
  const lead = useAuthedQuery(api.serviceLeads.get, { id: params.id as Id<"serviceLeads"> });

  if (lead === undefined) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/service-leads" label="Service leads" />} title="Inquiry" />
        <div className="h-48 border border-border bg-muted/60" aria-hidden />
      </div>
    );
  }

  if (lead === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/service-leads" label="Service leads" />} title="Inquiry" />
        <p className="max-w-prose text-sm text-muted-foreground">This inquiry is not in your inbox.</p>
      </div>
    );
  }

  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/service-leads" label="Service leads" />}
          title={lead.name}
          description="Review the inquiry and update status or assignment."
        />
        <ServiceLeadEditForm lead={lead} />
      </div>
    </UnsavedChangesProvider>
  );
}
