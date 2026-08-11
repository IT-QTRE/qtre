"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DeveloperForm } from "@/components/admin/developers/developer-form";
import { BackLink } from "@/components/admin/back-link";

export default function DeveloperEditPage() {
  const params = useParams<{ id: string }>();
  const developer = useQuery(api.developers.get, { id: params.id as Id<"developers"> });

  if (developer === undefined) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (developer === null) {
    return <p className="text-muted-foreground">Developer not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/developers" label="Back to Developers" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{developer.name.en}</h1>
        <p className="text-muted-foreground">Edit developer profile.</p>
      </div>
      <DeveloperForm mode="edit" developer={developer} />
    </div>
  );
}
