import { describe, expect, it } from "vitest";
import { agentSchema } from "./agents";

describe("agentSchema", () => {
  it("requires name/email/publishing, rejects an invalid email", () => {
    const base = {
      name: "Agent One",
      email: "agent1@example.com",
      publishing: { slug: "agent-one", status: "published", updatedAt: Date.now() },
    };
    expect(agentSchema.safeParse(base).success).toBe(true);
    expect(agentSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });
});
