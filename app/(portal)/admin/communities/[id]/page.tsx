"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CommunityForm } from "@/components/admin/communities/community-form";
import { BackLink } from "@/components/admin/back-link";

export default function CommunityEditPage() {
  const params = useParams<{ id: string }>();
  const community = useQuery(api.communities.get, { id: params.id as Id<"communities"> });

  if (community === undefined) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (community === null) {
    return <p className="text-muted-foreground">Community not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/communities" label="Back to Communities" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{community.name.en}</h1>
        <p className="text-muted-foreground">Edit community profile.</p>
      </div>
      <CommunityForm mode="edit" community={community} />
    </div>
  );
}
