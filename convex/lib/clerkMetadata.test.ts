import { describe, expect, it } from "vitest";
import { resolveRoleFromClerkMetadata } from "./clerkMetadata";

describe("resolveRoleFromClerkMetadata", () => {
  it("returns agent when public_metadata.role is agent (set by an invite)", () => {
    expect(resolveRoleFromClerkMetadata({ role: "agent" })).toBe("agent");
  });

  it("defaults to client when there is no role metadata (organic self-signup)", () => {
    expect(resolveRoleFromClerkMetadata({})).toBe("client");
    expect(resolveRoleFromClerkMetadata(null)).toBe("client");
    expect(resolveRoleFromClerkMetadata(undefined)).toBe("client");
  });

  it("never resolves to admin/super_admin from metadata — those roles have no self/invite provisioning path", () => {
    expect(resolveRoleFromClerkMetadata({ role: "admin" })).toBe("client");
    expect(resolveRoleFromClerkMetadata({ role: "super_admin" })).toBe("client");
  });
});
