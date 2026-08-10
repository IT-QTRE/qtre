import type { Role } from "./roles";

// Deliberately narrow: the only role Clerk metadata can ever grant is
// "agent" (set by convex/agentInvitations.ts's inviteAgent action at
// invitation time). Everything else — including any attempt to smuggle
// "admin"/"super_admin" through metadata — resolves to the safe default,
// since those roles have no self-service or invite-based provisioning path.
export function resolveRoleFromClerkMetadata(publicMetadata: unknown): Role {
  if (
    publicMetadata &&
    typeof publicMetadata === "object" &&
    "role" in publicMetadata &&
    (publicMetadata as { role: unknown }).role === "agent"
  ) {
    return "agent";
  }
  return "client";
}
