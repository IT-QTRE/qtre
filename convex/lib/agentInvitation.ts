// This body's shape is read back on the invited Agent's first login by
// convex/lib/clerkMetadata.ts's resolveRoleFromClerkMetadata — the two must
// stay in sync (this sets `{ role: "agent" }`, that reads `role === "agent"`).
export function buildInvitationRequestBody(email: string) {
  return {
    email_address: email,
    public_metadata: { role: "agent" },
  };
}
