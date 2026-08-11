"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table";
import { getAgentColumns } from "@/components/admin/agents/agent-columns";

export default function AgentsPage() {
  const agents = useQuery(api.agents.list);
  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    agents ? { entityType: "agent", entityIds: agents.map((agent) => agent._id) } : "skip",
  );
  const thumbnailByAgentId = new Map(Object.entries(thumbnails ?? {}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Agents</h1>
          <p className="text-muted-foreground">Manage agent profiles.</p>
        </div>
        <Button render={<Link href="/admin/agents/new" />} nativeButton={false}>
          <Plus className="size-4" />
          Add Agent
        </Button>
      </div>
      {agents === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={getAgentColumns(thumbnailByAgentId)}
          data={agents}
          searchPlaceholder="Search agents..."
          filterColumnId="nameText"
        />
      )}
    </div>
  );
}
