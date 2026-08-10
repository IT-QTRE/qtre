import { describe, expect, it } from "vitest";
import { buildInvitationRequestBody } from "./agentInvitation";

describe("buildInvitationRequestBody", () => {
  it("sets public_metadata.role to agent so ensureUserProvisioned can pick it up on first login", () => {
    expect(buildInvitationRequestBody("agent@example.com")).toEqual({
      email_address: "agent@example.com",
      public_metadata: { role: "agent" },
    });
  });
});
