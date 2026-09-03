"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ROLES, type Role } from "@/convex/lib/roles";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { UserList } from "@/components/admin/users/user-list";
import { InviteAgentDialog } from "@/components/admin/users/invite-agent-dialog";
import { formatRoleLabel } from "@/components/admin/users/user-role-select";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const ROLE_FILTERS = [
  { id: "all", label: "All" },
  ...ROLES.map((role) => ({ id: role, label: formatRoleLabel(role) })),
] as const;

type RoleFilter = (typeof ROLE_FILTERS)[number]["id"];

function parseRole(value: string | null): RoleFilter {
  if (value && (ROLES as readonly string[]).includes(value)) return value as Role;
  return "all";
}

function hrefWithRole(pathname: string, queryString: string, role: RoleFilter) {
  const params = new URLSearchParams(queryString);
  if (role === "all") params.delete("role");
  else params.set("role", role);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function UserListSkeleton() {
  return (
    <div className="divide-y divide-border border-y border-border" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3.5">
          <div className="h-3 w-40 bg-muted" />
          <div className="ms-auto h-3 w-24 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleFilter = parseRole(searchParams.get("role"));
  const currentActor = useAuthedQuery(api.users.current, {});
  const users = useAuthedQuery(api.users.list, {});

  function setRole(value: RoleFilter) {
    router.replace(hrefWithRole(pathname, searchParams.toString(), value), { scroll: false });
  }

  const scoped = useMemo(() => {
    if (!users) return [];
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      return true;
    });
  }, [users, roleFilter]);

  const filters = (
    <AdminFilterGroup
      label="Role"
      layout="wrap"
      options={ROLE_FILTERS}
      value={roleFilter}
      onChange={setRole}
    />
  );

  const isLoading = currentActor === undefined || users === undefined;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Users & Roles"
        description="Staff and client accounts. Role changes take effect immediately."
        actions={<InviteAgentDialog />}
      />

      {isLoading || currentActor == null ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{filters}</div>
          <UserListSkeleton />
        </div>
      ) : users.length === 0 ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">No accounts yet.</p>
      ) : (
        <UserList users={scoped} currentActor={currentActor} toolbar={filters} />
      )}
    </div>
  );
}
