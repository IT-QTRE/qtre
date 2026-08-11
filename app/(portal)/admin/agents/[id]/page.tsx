"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AgentForm } from "@/components/admin/agents/agent-form";
import { BackLink } from "@/components/admin/back-link";

export default function AgentEditPage() {
  const params = useParams<{ id: string }>();
  const agent = useQuery(api.agents.get, { id: params.id as Id<"agents"> });

  if (agent === undefined) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (agent === null) {
    return <p className="text-muted-foreground">Agent not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/agents" label="Back to Agents" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{agent.name}</h1>
        <p className="text-muted-foreground">Edit agent profile.</p>
      </div>
      <AgentForm mode="edit" agent={agent} />
    </div>
  );
}
