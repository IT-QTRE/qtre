"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ROLES, type Role } from "@/convex/lib/roles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

function needsSuperAdminConfirm(from: Role, to: Role) {
  return from === "super_admin" || to === "super_admin";
}

export function UserRoleSelect({ user, currentActor }: UserRoleSelectProps) {
  const updateRole = useMutation(api.users.updateRole);
  const availableRoles = getAvailableRoles(currentActor, user);
  const disabled = availableRoles === null;
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function applyRole(role: Role) {
    setIsPending(true);
    try {
      await updateRole({ id: user._id, role });
      toast.success("Role updated");
      setPendingRole(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsPending(false);
    }
  }

  const promoting = pendingRole === "super_admin";

  return (
    <>
      <Select
        value={user.role}
        disabled={disabled || isPending}
        onValueChange={(value) => {
          if (value == null || disabled) return;
          const role = value as Role;
          if (role === user.role) return;
          if (needsSuperAdminConfirm(user.role, role)) {
            setPendingRole(role);
            return;
          }
          void applyRole(role);
        }}
      >
        <SelectTrigger
          className="min-h-11 min-w-36 touch-manipulation"
          aria-label={`Role for ${user.name}`}
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
      <AlertDialog
        open={pendingRole !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingRole(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {promoting ? `Make ${user.name} a Super Admin?` : `Remove Super Admin from ${user.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {promoting
                ? "They will be able to manage all staff, access, and settings."
                : `They will become ${pendingRole ? formatRoleLabel(pendingRole) : "another role"} instead.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-1 sm:grid sm:grid-cols-2">
            <AlertDialogCancel className="min-h-11 w-full sm:min-w-0" disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 w-full sm:min-w-0"
              disabled={isPending || pendingRole == null}
              onClick={(event) => {
                event.preventDefault();
                if (pendingRole == null) return;
                void applyRole(pendingRole);
              }}
            >
              {isPending ? "Saving…" : promoting ? "Make Super Admin" : "Change Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
