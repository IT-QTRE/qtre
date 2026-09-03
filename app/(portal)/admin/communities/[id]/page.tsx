"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CommunityForm } from "@/components/admin/communities/community-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

export default function CommunityEditPage() {
  const params = useParams<{ id: string }>();
  const community = useAuthedQuery(api.communities.get, { id: params.id as Id<"communities"> });

  if (community === undefined) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/communities" label="Communities" />} title="Community" />
        <div className="h-48 border border-border bg-muted/60" aria-hidden />
      </div>
    );
  }
  if (community === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/communities" label="Communities" />} title="Community" />
        <p className="max-w-prose text-sm text-muted-foreground">This community is not in your catalog.</p>
      </div>
    );
  }

  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/communities" label="Communities" />}
          title={community.name.en}
          description="Edit neighborhood, photos, and publishing."
        />
        <CommunityForm mode="edit" community={community} />
      </div>
    </UnsavedChangesProvider>
  );
}
