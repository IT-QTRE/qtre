"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PropertyForm } from "@/components/admin/properties/property-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

export default function PropertyEditPage() {
  const params = useParams<{ id: string }>();
  const property = useAuthedQuery(api.properties.get, { id: params.id as Id<"properties"> });

  if (property === undefined) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/properties" label="Properties" />} title="Property" />
        <div className="h-48 border border-border bg-muted/60" aria-hidden />
      </div>
    );
  }
  if (property === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/properties" label="Properties" />} title="Property" />
        <p className="max-w-prose text-sm text-muted-foreground">This property is not in your catalog.</p>
      </div>
    );
  }

  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/properties" label="Properties" />}
          title={property.title.en}
          description="Edit listing, photos, and publishing."
        />
        <PropertyForm mode="edit" property={property} />
      </div>
    </UnsavedChangesProvider>
  );
}
