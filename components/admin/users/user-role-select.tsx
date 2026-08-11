"use client";

import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ROLES, type Role } from "@/convex/lib/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function formatRoleLabel(role: Role): string {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Client-side mirror of decision 9 / `users.updateRole` enforcement.
 * Returns `null` when the Select must be fully disabled; otherwise the
 * roles the actor is allowed to assign for this target row.
 */
export function getAvailableRoles(
  currentActor: Doc<"users">,
  target: Doc<"users">,
): Role[] | null {
  // 1. Nobody can change their own role.
  if (target._id === currentActor._id) {
    return null;
  }
  // 2. Admins cannot touch existing Admin / Super Admin accounts.
  if (
    currentActor.role === "admin" &&
    (target.role === "admin" || target.role === "super_admin")
  ) {
    return null;
  }
  // 3. Admins may only assign agent/client (cannot promote).
  if (currentActor.role === "admin") {
    return ["agent", "client"];
  }
  // 4. Super Admin: all four roles for every non-self row.
  return [...ROLES];
}

function getDisabledReason(currentActor: Doc<"users">, target: Doc<"users">): string {
  if (target._id === currentActor._id) {
    return "You cannot change your own role";
  }
  return "Admins cannot manage Admin or Super Admin accounts";
}

type UserRoleSelectProps = {
  user: Doc<"users">;
  currentActor: Doc<"users">;
};

export function UserRoleSelect({ user, currentActor }: UserRoleSelectProps) {
  const updateRole = useMutation(api.users.updateRole);
  const availableRoles = getAvailableRoles(currentActor, user);
  const disabled = availableRoles === null;

  return (
    <Select
      value={user.role}
      disabled={disabled}
      onValueChange={async (value) => {
        if (value == null || disabled) return;
        const role = value as Role;
        try {
          await updateRole({ id: user._id, role });
          toast.success("Role updated");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to update role");
        }
      }}
    >
      <SelectTrigger
        size="sm"
        className="w-42"
        title={disabled ? getDisabledReason(currentActor, user) : undefined}
      >
        <SelectValue>{formatRoleLabel(user.role)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(availableRoles ?? [user.role]).map((role) => (
          <SelectItem key={role} value={role}>
            {formatRoleLabel(role)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
