import { describe, expect, it } from "vitest";
import { leadSchema } from "./leads";

describe("leadSchema", () => {
  it("requires name/email, defaults status to new when omitted", () => {
    const result = leadSchema.safeParse({ name: "Jane Buyer", email: "jane@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("new");
    }
  });
});
