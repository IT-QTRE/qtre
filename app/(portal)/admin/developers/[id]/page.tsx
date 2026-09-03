"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DeveloperForm } from "@/components/admin/developers/developer-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

export default function DeveloperEditPage() {
  const params = useParams<{ id: string }>();
  const developer = useAuthedQuery(api.developers.get, { id: params.id as Id<"developers"> });

  if (developer === undefined) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/developers" label="Developers" />} title="Developer" />
        <div className="h-48 border border-border bg-muted/60" aria-hidden />
      </div>
    );
  }
  if (developer === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/developers" label="Developers" />} title="Developer" />
        <p className="max-w-prose text-sm text-muted-foreground">This developer is not in your catalog.</p>
      </div>
    );
  }

  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/developers" label="Developers" />}
          title={developer.name.en}
          description="Edit profile, logo, and publishing."
        />
        <DeveloperForm mode="edit" developer={developer} />
      </div>
    </UnsavedChangesProvider>
  );
}
