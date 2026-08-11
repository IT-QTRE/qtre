"use client";

import { AgentForm } from "@/components/admin/agents/agent-form";
import { BackLink } from "@/components/admin/back-link";

export default function NewAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/agents" label="Back to Agents" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Agent</h1>
        <p className="text-muted-foreground">Create a new agent profile.</p>
      </div>
      <AgentForm mode="create" />
    </div>
  );
}
