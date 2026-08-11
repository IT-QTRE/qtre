"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ROLES, type Role } from "@/convex/lib/roles";
import { DataTable } from "@/components/admin/data-table";
import { getUserColumns } from "@/components/admin/users/user-columns";
import { InviteAgentDialog } from "@/components/admin/users/invite-agent-dialog";
import { formatRoleLabel } from "@/components/admin/users/user-role-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsersPage() {
  const currentActor = useQuery(api.users.current);
  const users = useQuery(api.users.list);
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  const isLoading = currentActor === undefined || users === undefined;

  const filteredUsers =
    !users || roleFilter === "all" ? (users ?? []) : users.filter((user) => user.role === roleFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Users & Roles</h1>
        <p className="text-muted-foreground">
          Manage staff and client accounts and their permissions.
        </p>
      </div>

      {isLoading || currentActor == null ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                if (value == null) return;
                setRoleFilter(value as Role | "all");
              }}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InviteAgentDialog />
          </div>

          <DataTable
            columns={getUserColumns(currentActor)}
            data={filteredUsers}
            searchPlaceholder="Search users..."
            filterColumnId="name"
          />
        </>
      )}
    </div>
  );
}
