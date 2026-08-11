"use client";

import { CommunityForm } from "@/components/admin/communities/community-form";
import { BackLink } from "@/components/admin/back-link";

export default function NewCommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/communities" label="Back to Communities" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Community</h1>
        <p className="text-muted-foreground">Create a new community profile.</p>
      </div>
      <CommunityForm mode="create" />
    </div>
  );
}
